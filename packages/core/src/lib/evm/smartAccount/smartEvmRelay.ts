import { AsyncResult, Ok, Err } from '@gardenfi/utils';
import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  getContract,
  http,
  maxUint256,
  PublicClient,
} from 'viem';
import { isEVM, isEvmNativeToken, MatchedOrder } from '@gardenfi/orderbook';
import { Fetcher, trim0x } from '@catalogfi/utils';
import { APIResponse, IAuth, Url, with0x } from '@gardenfi/utils';
import { AtomicSwapABI } from '../abi/atomicSwap';
import { IEVMHTLC } from '../htlc.types';
import { evmToViemChainMap } from '../../switchOrAddNetwork';
import { SmartAccountClient } from 'permissionless';

export class SmartAccountRelay implements IEVMHTLC {
  private url: Url;
  private auth: IAuth;
  private smartAccountClient: SmartAccountClient;
  private publicClient: PublicClient;

  constructor(
    url: string | Url,
    smartAccountClient: SmartAccountClient,
    auth: IAuth,
  ) {
    this.url = new Url('/relayer', url);
    this.auth = auth;
    this.smartAccountClient = smartAccountClient;
    this.publicClient = createPublicClient({
      chain: this.smartAccountClient.chain,
      transport: http(),
    });

    if (!this.isValidSmartAccount(smartAccountClient)) {
      throw new Error(
        'Invalid SmartAccountClient provided. Must have a smart account type.',
      );
    }
  }

  private isValidSmartAccount(client: SmartAccountClient): boolean {
    const isSmart = client.account?.type === 'smart';
    console.log('Validating smart account client', isSmart);
    return 'account' in client && 'sendUserOperation' in client && isSmart;
  }

  get htlcActorAddress(): string {
    if (!this.smartAccountClient.account) {
      throw new Error('No account found in smart account client');
    }
    return this.smartAccountClient.account.address;
  }

  private async executeTransaction(
    contractCall: () => Promise<`0x${string}`>,
  ): Promise<`0x${string}`> {
    try {
      return await contractCall();
    } catch (error) {
      throw new Error(`Smart account transaction failed: ${error}`);
    }
  }

  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    if (!this.smartAccountClient.account) return Err('No account found');
    const accountAddress = this.htlcActorAddress;

    if (
      accountAddress.toLowerCase() !== order.source_swap.initiator.toLowerCase()
    )
      return Err('Account address and order initiator mismatch');

    if (!isEVM(order.source_swap.chain))
      return Err('Source chain is not an EVM chain');

    if (
      this.smartAccountClient.chain?.id !==
      evmToViemChainMap[order.source_swap.chain].id
    ) {
      return Err(
        'Chain mismatch for smart account. Please ensure your smart account client is configured for the correct chain.',
      );
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

    // Determine if it's a native token or ERC20
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
      );
    }
  }

  private async getTokenAddress(asset: string): AsyncResult<string, string> {
    try {
      const atomicSwap = getContract({
        address: with0x(asset),
        abi: AtomicSwapABI,
        client: this.publicClient,
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
      const txHash = await this.executeTransaction(async () => {
        return await this.smartAccountClient.writeContract({
          address: with0x(asset),
          abi: AtomicSwapABI,
          functionName: 'initiate',
          args: [redeemer, timelock, amount, secretHash],
          account: this.smartAccountClient.account!,
          chain: this.smartAccountClient.chain,
        });
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
  ): AsyncResult<string, string> {
    try {
      if (!this.smartAccountClient.account) {
        return Err('No account found in smart account client');
      }

      const erc20Contract = getContract({
        address: with0x(tokenAddress),
        abi: erc20Abi,
        client: this.publicClient,
      });

      const currentAllowance = await erc20Contract.read.allowance([
        this.smartAccountClient.account.address,
        with0x(asset),
      ]);

      console.log('Current allowance:', currentAllowance.toString());

      let txHash: `0x${string}`;

      if (currentAllowance < amount) {
        console.log(
          'Insufficient allowance, creating batch transaction for approval + initiate',
        );

        txHash = await this.executeTransaction(async () => {
          return await this.smartAccountClient.sendUserOperation({
            calls: [
              // First call: Approve token spend
              {
                to: with0x(tokenAddress),
                data: encodeFunctionData({
                  abi: erc20Abi,
                  functionName: 'approve',
                  args: [with0x(asset), maxUint256],
                }),
                value: BigInt(0),
              },
              // Second call: Initiate HTLC
              {
                to: with0x(asset),
                data: encodeFunctionData({
                  abi: AtomicSwapABI,
                  functionName: 'initiate',
                  args: [redeemer, timelock, amount, secretHash],
                }),
                value: BigInt(0),
              },
            ],
            account: this.smartAccountClient.account!,
          });
        });

        console.log('Batch transaction (approval + initiate) hash:', txHash);
      } else {
        console.log(
          'Sufficient allowance exists, executing only initiate transaction',
        );

        txHash = await this.executeTransaction(async () => {
          return await this.smartAccountClient.writeContract({
            address: with0x(asset),
            abi: AtomicSwapABI,
            functionName: 'initiate',
            args: [redeemer, timelock, amount, secretHash],
            account: this.smartAccountClient.account!,
            chain: this.smartAccountClient.chain,
          });
        });

        console.log('Initiate transaction hash:', txHash);
      }

      return Ok(txHash);
    } catch (error) {
      return Err('Failed to initiate on ERC20 HTLC: ' + String(error));
    }
  }

  // private async _initiateOnErc20HTLCWithRelayer(
  //   secretHash: `0x${string}`,
  //   timelock: bigint,
  //   amount: bigint,
  //   redeemer: `0x${string}`,
  //   asset: string,
  //   tokenAddress: string,
  //   orderId: string,
  // ): AsyncResult<string, string> {
  //   try {
  //     const auth = await this.auth.getAuthHeaders();
  //     if (auth.error) return Err(auth.error);

  //     const publicClient = createPublicClient({
  //       chain: sepolia,
  //       transport: http(),
  //     });

  //     const atomicSwap = getContract({
  //       address: with0x(asset),
  //       abi: AtomicSwapABI,
  //       client: publicClient,
  //     });

  //     // Step 1: Handle approval for smart account
  //     const approval = await this.handleApproval(amount, tokenAddress, asset);
  //     if (!approval.ok) return Err(approval.error);

  //     const domain = await atomicSwap.read.eip712Domain();

  //     if (!this.smartAccountClient.account) {
  //       return Err('No account found for signing');
  //     }

  //     // Step 2: Sign typed data with smart account
  //     const signature = await this.smartAccountClient.signTypedData({
  //       account: this.smartAccountClient.account,
  //       domain: {
  //         name: domain[1],
  //         version: domain[2],
  //         chainId: Number(domain[3]),
  //         verifyingContract: domain[4],
  //       },
  //       types: {
  //         Initiate: [
  //           { name: 'redeemer', type: 'address' },
  //           { name: 'timelock', type: 'uint256' },
  //           { name: 'amount', type: 'uint256' },
  //           { name: 'secretHash', type: 'bytes32' },
  //         ],
  //       },
  //       primaryType: 'Initiate',
  //       message: {
  //         redeemer,
  //         timelock,
  //         amount,
  //         secretHash,
  //       },
  //     });
  //     console.log('Signature for initiate:', signature, 'orderId:', orderId);

  //     const headers: Record<string, string> = {
  //       ...auth.val,
  //       'Content-Type': 'application/json',
  //     };

  //     // Step 3: Send to relayer
  //     const res = await Fetcher.post<APIResponse<string>>(
  //       this.url.endpoint('initiate'),
  //       {
  //         body: JSON.stringify({
  //           order_id: orderId,
  //           signature,
  //           perform_on: 'Source',
  //         }),
  //         headers,
  //       },
  //     );
  //     if (res.error) return Err(res.error);
  //     return res.result ? Ok(res.result) : Err('Init: No result found');
  //   } catch (error) {
  //     console.log('init error :', error);
  //     return Err(String(error));
  //   }
  // }

  // private async handleApproval(
  //   amount: bigint,
  //   tokenAddress: string,
  //   spender: string,
  // ): AsyncResult<void, string> {
  //   try {
  //     if (!this.smartAccountClient.account) {
  //       return Err('No account found in smart account client');
  //     }
  //     const erc20Contract = getContract({
  //       address: with0x(tokenAddress),
  //       abi: erc20Abi,
  //       client: this.publicClient,
  //     });

  //     console.log(
  //       'Checking allowance for smart account approval',
  //       this.smartAccountClient.account.address,
  //       'tokenaddress:',
  //       tokenAddress,
  //       'spender:',
  //       spender,
  //       'amount:',
  //       amount.toString(),
  //     );

  //     const currentAllowance = await erc20Contract.read.allowance([
  //       this.smartAccountClient.account.address,
  //       with0x(spender),
  //     ]);

  //     console.log('Current allowance:', currentAllowance.toString());

  //     if (currentAllowance < amount) {
  //       console.log('Approving token spend...');

  //       const approveTxHash = await this.executeTransaction(async () => {
  //         return await this.smartAccountClient.writeContract({
  //           address: with0x(tokenAddress),
  //           abi: erc20Abi,
  //           functionName: 'approve',
  //           args: [with0x(spender), maxUint256],
  //           account: this.smartAccountClient.account!,
  //           chain: this.smartAccountClient.chain,
  //         });
  //       });

  //       console.log('Approval transaction hash:', approveTxHash);
  //     } else {
  //       console.log('Sufficient allowance already exists');
  //     }

  //     return Ok(undefined);
  //   } catch (error) {
  //     return Err('Failed to handle smart account approval: ' + String(error));
  //   }
  // }

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
