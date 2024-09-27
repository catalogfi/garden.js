import { checkAllowanceAndApprove } from '@gardenfi/utils';
import { WalletClient, getContract } from 'viem';
import { Asset, MatchedOrder } from '@gardenfi/orderbook';
import { IEVMRelay } from './evmRelay.types';
import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import {
  APIResponse,
  Authorization,
  IAuth,
  Url,
  with0x,
} from '@gardenfi/utils';
import { AtomicSwapABI } from './abi';
import { ParseSwapStatus } from '../order/parseOrderStatus';
import { SwapStatus } from '../order/order.types';

export class EvmRelay implements IEVMRelay {
  private walletClient: WalletClient;
  private url: Url;
  private auth: IAuth;

  constructor(url: string, walletClient: WalletClient, auth: IAuth) {
    this.walletClient = walletClient;
    this.url = new Url('/relayer', url);
    this.auth = auth;
  }

  async init(
    order: MatchedOrder,
    asset: Asset,
    currentL1BlockNumber: number,
  ): AsyncResult<string, string> {
    if (!this.walletClient.account) return Err('No account found');
    if (
      this.walletClient.account.address.toLowerCase() !==
      order.source_swap.initiator.toLowerCase()
    )
      return Err('Account and order initiator mismatch');
    if (
      order.source_swap.asset.toLowerCase() !==
      asset.atomicSwapAddress.toLowerCase()
    )
      return Err('Asset and order asset mismatch');

    const swapStatus = ParseSwapStatus(order.source_swap, currentL1BlockNumber);
    if (swapStatus !== SwapStatus.Idle) return Err('Invalid swap status');

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
      const auth = await this.auth.getToken();
      if (auth.error) return Err(auth.error);

      const atomicSwap = getContract({
        address: with0x(order.source_swap.asset),
        abi: AtomicSwapABI,
        client: this.walletClient,
      });
      const domain = await atomicSwap.read.eip712Domain();

      const approval = await checkAllowanceAndApprove(
        Number(amount),
        asset.tokenAddress,
        order.source_swap.asset,
        this.walletClient,
      );
      if (approval.error) return Err(approval.error);

      const signature = await this.walletClient.signTypedData({
        account: this.walletClient.account,
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

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('initiate'),
        {
          body: JSON.stringify({
            order_id: create_order.create_id,
            signature,
            perform_on: 'Source',
          }),
          headers: {
            Authorization: Authorization(auth.val),
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Init: No result found');
    } catch (error) {
      console.log('init error :', error);
      return Err(String(error));
    }
  }

  async redeem(orderId: string, secret: string): AsyncResult<string, string> {
    if (!this.walletClient.account) return Err('No account found');
    try {
      const auth = await this.auth.getToken();
      if (auth.error) return Err(auth.error);

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: orderId,
            secret,
            perform_on: 'Destination',
          }),
          headers: {
            Authorization: Authorization(auth.val),
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
}
