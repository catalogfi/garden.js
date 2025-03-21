import {
  AsyncResult,
  checkAllowanceAndApprove,
  Ok,
  Err,
} from '@gardenfi/utils';
import { WalletClient, getContract } from 'viem';
import { MatchedOrder } from '@gardenfi/orderbook';
import { Fetcher, trim0x } from '@catalogfi/utils';
import { APIResponse, IAuth, Url, with0x } from '@gardenfi/utils';
import { AtomicSwapABI } from '../abi/atomicSwap';
import { IEVMHTLC } from '../htlc.types';

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

    try {
      const auth = await this.auth.getAuthHeaders();
      if (auth.error) return Err(auth.error);

      const atomicSwap = getContract({
        address: with0x(order.source_swap.asset),
        abi: AtomicSwapABI,
        client: this.wallet,
      });
      const token = await atomicSwap.read.token();

      const approval = await checkAllowanceAndApprove(
        Number(amount),
        token,
        order.source_swap.asset,
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
            order_id: create_order.create_id,
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
