import {
  AsyncResult,
  checkAllowanceAndApprove,
  Ok,
  Err,
} from '@gardenfi/utils';
import {
  WalletClient,
  createPublicClient,
  erc20Abi,
  getContract,
  http,
} from 'viem';
import { isEVM, isEvmNativeToken, MatchedOrder } from '@gardenfi/orderbook';
import { Fetcher, trim0x } from '@catalogfi/utils';
import { APIResponse, IAuth, Url, with0x } from '@gardenfi/utils';
import { AtomicSwapABI } from '../abi/atomicSwap';
import { IEVMHTLC } from '../htlc.types';
import {
  evmToViemChainMap,
  switchOrAddNetwork,
} from './../../switchOrAddNetwork';
import { nativeHTLCAbi } from '../abi/nativeHTLC';
import { SmartAccountClient } from 'permissionless';
import { sepolia } from 'viem/chains';

type ClientType = WalletClient | SmartAccountClient;

export class EvmRelay implements IEVMHTLC {
  private url: Url;
  private auth: IAuth;
  private wallet: ClientType;
  private isSmartAccount: boolean;

  constructor(
    url: string | Url,
    walletConfig: WalletClient | SmartAccountClient,
    auth: IAuth,
  ) {
    this.url = new Url('/relayer', url);
    this.auth = auth;
    this.wallet = walletConfig;
    // Check if it's a smart account client
    this.isSmartAccount = this.isSmartAccountClient(walletConfig);
  }

  private isSmartAccountClient(
    client: ClientType,
  ): client is SmartAccountClient {
    const isSmart = client.account?.type === 'smart';
    console.log('this says that given account is smart account', isSmart);
    return 'account' in client && 'sendUserOperation' in client;
  }

  // Get WalletClient (for EOA operations)
  private get walletClient(): WalletClient {
    if (this.isSmartAccount) {
      throw new Error('Cannot get wallet client from smart account client');
    }
    return this.wallet as WalletClient;
  }

  // Get SmartAccountClient (for smart account operations)
  private get smartAccountClient(): SmartAccountClient {
    if (!this.isSmartAccount) {
      throw new Error('Cannot get smart account client from wallet client');
    }
    return this.wallet as SmartAccountClient;
  }

  get htlcActorAddress(): string {
    if (this.isSmartAccount) {
      if (!this.smartAccountClient.account) {
        throw new Error('No account found in smart account client');
      }
      return this.smartAccountClient.account.address;
    }

    const walletClient = this.wallet as WalletClient;
    if (!walletClient.account) throw new Error('No account found');
    return walletClient.account.address;
  }

  // Helper method to execute transaction based on account type
  private async executeTransaction(
    contractCall: () => Promise<`0x${string}`>,
  ): Promise<`0x${string}`> {
    try {
      return await contractCall();
    } catch (error) {
      const accountType = this.isSmartAccount ? 'Smart account' : 'EOA';
      throw new Error(`${accountType} transaction failed: ${error}`);
    }
  }

  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    if (!this.wallet.account) return Err('No account found');
    const accountAddress = this.htlcActorAddress;

    if (
      accountAddress.toLowerCase() !== order.source_swap.initiator.toLowerCase()
    )
      return Err('Account address and order initiator mismatch');

    if (!isEVM(order.source_swap.chain))
      return Err('Source chain is not an EVM chain');

    // Handle network switching only for EOA wallets
    if (!this.isSmartAccount) {
      const _walletClient = await switchOrAddNetwork(
        order.source_swap.chain,
        this.walletClient,
      );
      if (_walletClient.error) return Err(_walletClient.error);
      this.wallet = _walletClient.val.walletClient;
    } else {
      // For smart accounts, ensure the chain is correct
      if (
        this.smartAccountClient.chain?.id !==
        evmToViemChainMap[order.source_swap.chain].id
      ) {
        return Err(
          'Chain mismatch for smart account. Please ensure your smart account client is configured for the correct chain.',
        );
      }
    }

    const { create_order, source_swap } = order;

    if (
      !source_swap.amount ||
      !source_swap.redeemer ||
      !create_order.timelock ||
      !create_order.secret_hash
    )
      return Err('Invalid order');

    const secretHash = with0x(create_order.secret_hash);
    const timelock = BigInt(create_order.timelock);
    const redeemer = with0x(source_swap.redeemer);
    const amount = BigInt(source_swap.amount);

    const tokenAddress = await this.getTokenAddress(order.source_swap.asset);
    if (!tokenAddress.ok) return Err(tokenAddress.error);

    if (isEvmNativeToken(order.source_swap.chain, tokenAddress.val)) {
      return this._initiateOnNativeHTLC(
        secretHash,
        timelock,
        amount,
        redeemer,
        order.source_swap.asset,
      );
    } else {
      return this._initiateOnErc20HTLC(
        secretHash,
        timelock,
        amount,
        redeemer,
        order.source_swap.asset,
        tokenAddress.val,
        create_order.create_id,
      );
    }
  }

  private async getTokenAddress(asset: string): AsyncResult<string, string> {
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });
      const atomicSwap = getContract({
        address: with0x(asset),
        abi: AtomicSwapABI,
        client: publicClient,
      });

      const token = await atomicSwap.read.token();
      return Ok(token);
    } catch (error) {
      return Err('Failed to get token address: ' + String(error));
    }
  }

  private async _initiateOnNativeHTLC(
    secretHash: `0x${string}`,
    timelock: bigint,
    amount: bigint,
    redeemer: `0x${string}`,
    asset: string,
  ): AsyncResult<string, string> {
    try {
      const contract = getContract({
        address: with0x(asset),
        abi: nativeHTLCAbi,
        client: this.wallet,
      });

      const txHash = await this.executeTransaction(async () => {
        if (this.isSmartAccount) {
          return await this.smartAccountClient.writeContract({
            address: with0x(asset),
            abi: nativeHTLCAbi,
            functionName: 'initiate',
            args: [redeemer, timelock, amount, secretHash],
            value: amount,
            account: this.smartAccountClient.account!,
            chain: this.smartAccountClient.chain,
          });
        } else {
          return await contract.write.initiate(
            [redeemer, timelock, amount, secretHash],
            {
              account: this.walletClient.account!,
              chain: this.walletClient.chain,
              value: amount,
            },
          );
        }
      });

      return Ok(txHash);
    } catch (error) {
      return Err('Failed to initiate on native HTLC: ' + String(error));
    }
  }

  private async _initiateOnErc20HTLC(
    secretHash: `0x${string}`,
    timelock: bigint,
    amount: bigint,
    redeemer: `0x${string}`,
    asset: string,
    tokenAddress: string,
    orderId: string,
  ): AsyncResult<string, string> {
    try {
      const auth = await this.auth.getAuthHeaders();
      if (auth.error) return Err(auth.error);

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const atomicSwap = getContract({
        address: with0x(asset),
        abi: AtomicSwapABI,
        client: publicClient,
      });

      // Handle approval for both EOA and smart accounts
      const approval = await this.handleApproval(amount, tokenAddress, asset);
      if (approval.error) return Err(approval.error);

      const domain = await atomicSwap.read.eip712Domain();

      // Get the account for signing
      const accountToSign = this.isSmartAccount
        ? this.smartAccountClient.account
        : this.walletClient.account!;

      if (!accountToSign) {
        return Err('No account found for signing');
      }

      // Sign typed data - both EOA and smart accounts can sign
      const signature = await this.wallet.signTypedData({
        account: accountToSign,
        domain: {
          name: domain[1],
          version: domain[2],
          chainId: Number(domain[3]),
          verifyingContract: domain[4],
        },
        types: {
          Initiate: [
            { name: 'redeemer', type: 'address' },
            { name: 'timelock', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'secretHash', type: 'bytes32' },
          ],
        },
        primaryType: 'Initiate',
        message: {
          redeemer,
          timelock,
          amount,
          secretHash,
        },
      });
      console.log('Signature for initiate:', signature, 'orderId:', orderId);

      const headers: Record<string, string> = {
        ...auth.val,
        'Content-Type': 'application/json',
      };

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('initiate'),
        {
          body: JSON.stringify({
            order_id: orderId,
            signature,
            perform_on: 'Source',
          }),
          headers,
        },
      );
      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Init: No result found');
    } catch (error) {
      console.log('init error :', error);
      return Err(String(error));
    }
  }

  private async handleApproval(
    amount: bigint,
    tokenAddress: string,
    spender: string,
  ): AsyncResult<void, string> {
    try {
      if (this.isSmartAccount) {
        // For smart accounts, handle approval using writeContract
        return await this.handleSmartAccountApproval(
          amount,
          tokenAddress,
          spender,
        );
      } else {
        // For EOA wallets, use existing checkAllowanceAndApprove function
        const approval = await checkAllowanceAndApprove(
          Number(amount),
          tokenAddress,
          spender,
          this.walletClient,
        );
        if (approval.error) return Err(approval.error);
        return Ok(undefined);
      }
    } catch (error) {
      return Err('Failed to handle approval: ' + String(error));
    }
  }

  private async handleSmartAccountApproval(
    amount: bigint,
    tokenAddress: string,
    spender: string,
  ): AsyncResult<void, string> {
    try {
      if (!this.smartAccountClient.account) {
        return Err('No account found in smart account client');
      }

      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const erc20Contract = getContract({
        address: with0x(tokenAddress),
        abi: erc20Abi,
        client: publicClient,
      });
      console.log(
        'Checking allowance for smart account approval',
        this.smartAccountClient.account.address,
        'tokenaddress:',
        tokenAddress,
        'spender:',
        spender,
        'amount:',
        amount.toString(),
      );
      const currentAllowance = await erc20Contract.read.allowance([
        this.smartAccountClient.account.address,
        with0x(spender),
      ]);

      if (currentAllowance < amount) {
        await this.smartAccountClient.writeContract({
          address: with0x(tokenAddress),
          abi: erc20Abi,
          functionName: 'approve',
          args: [with0x(spender), amount],
          account: this.smartAccountClient.account,
          chain: this.smartAccountClient.chain,
        });
      }

      return Ok(undefined);
    } catch (error) {
      return Err('Failed to handle smart account approval: ' + String(error));
    }
  }

  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const headers = await this.auth.getAuthHeaders();
      if (headers.error) return Err(headers.error);

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: order.create_order.create_id,
            secret: trim0x(secret),
            perform_on: 'Destination',
          }),
          headers: {
            ...headers.val,
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Redeem: No result found');
    } catch (error) {
      return Err(String(error));
    }
  }

  async refund(): AsyncResult<string, string> {
    return Err('Refund not supported');
  }
}
