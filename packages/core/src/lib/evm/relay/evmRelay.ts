import {
  AsyncResult,
  checkAllowanceAndApprove,
  Ok,
  Err,
  waitForTransactionReceipt,
} from '@gardenfi/utils';
import { WalletClient, createPublicClient, getContract, http } from 'viem';
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

export class EvmRelay implements IEVMHTLC {
  private url: Url;
  private auth: IAuth;
  private wallet: WalletClient;

  constructor(url: string | Url, wallet: WalletClient, auth: IAuth) {
    this.url = new Url('/relayer', url);
    this.auth = auth;
    this.wallet = wallet;
  }

  get htlcActorAddress(): string {
    if (!this.wallet.account) throw new Error('No account found');
    return this.wallet.account.address;
  }

  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    if (!this.wallet.account) return Err('No account found');
    if (
      this.wallet.account.address.toLowerCase() !==
      order.source_swap.initiator.toLowerCase()
    )
      return Err('Account address and order initiator mismatch');
    if (!isEVM(order.source_swap.chain))
      return Err('Source chain is not an EVM chain');

    const _walletClient = await switchOrAddNetwork(
      order.source_swap.chain,
      this.wallet,
    );
    if (_walletClient.error) return Err(_walletClient.error);
    this.wallet = _walletClient.val.walletClient;
    if (!this.wallet.account) return Err('No account found');

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
      const atomicSwap = getContract({
        address: with0x(asset),
        abi: AtomicSwapABI,
        client: this.wallet,
      });

      const token = await atomicSwap.read.token();
      return Ok(token);
    } catch (error) {
      return Err('Failed to get token address', String(error));
    }
  }

  private async _initiateOnNativeHTLC(
    secretHash: `0x${string}`,
    timelock: bigint,
    amount: bigint,
    redeemer: `0x${string}`,
    asset: string,
  ): AsyncResult<string, string> {
    if (!this.wallet.account) return Err('No account found');

    try {
      const contract = getContract({
        address: with0x(asset),
        abi: nativeHTLCAbi,
        client: this.wallet,
      });

      const txHash = await contract.write.initiate(
        [redeemer, timelock, amount, secretHash],
        {
          account: this.wallet.account,
          chain: this.wallet.chain,
          value: amount,
        },
      );

      return Ok(txHash);
    } catch (error) {
      return Err('Failed to initiate on native HTLC', String(error));
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
    if (!this.wallet.account) return Err('No account found');

    try {
      const auth = await this.auth.getAuthHeaders();
      if (auth.error) return Err(auth.error);

      const atomicSwap = getContract({
        address: with0x(asset),
        abi: AtomicSwapABI,
        client: this.wallet,
      });

      const approval = await checkAllowanceAndApprove(
        Number(amount),
        tokenAddress,
        asset,
        this.wallet,
      );
      if (approval.error) return Err(approval.error);

      const domain = await atomicSwap.read.eip712Domain();

      const signature = await this.wallet.signTypedData({
        account: this.wallet.account,
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
      const receipt = await waitForTransactionReceipt(
        this.wallet,
        res.result as `0x${string}`,
      );
      if (receipt.val && receipt.val.status === 'success') {
        return Ok(res.result ? res.result : 'Initiate hash not found');
      } else {
        return Err('Init failed: Transaction receipt not successful');
      }
    } catch (error) {
      console.log('init error :', error);
      return Err(String(error));
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

      const viemChain =
        evmToViemChainMap[
          order.destination_swap.chain as keyof typeof evmToViemChainMap
        ];

      const evmProvider = createPublicClient({
        chain: viemChain,
        transport: http(),
      });
      const receipt = await evmProvider.waitForTransactionReceipt({
        hash: res.result as `0x${string}`,
        confirmations: 1,
        timeout: 300000,
      });
      if (receipt && receipt.status === 'success') {
        return Ok(res.result ? res.result : 'Redeem hash not found');
      } else {
        return Err('Redeem failed: Transaction receipt not successful');
      }
    } catch (error) {
      return Err(String(error));
    }
  }

  async refund(): AsyncResult<string, string> {
    return Err('Refund not supported');
  }
}
