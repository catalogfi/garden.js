import { checkAllowanceAndApprove } from '@gardenfi/utils';
import { WalletClient, getContract } from 'viem';
import { MatchedOrder } from '@gardenfi/orderbook';
import { IEVMRelay } from './evmRelay.types';
import { AsyncResult, Err, Fetcher, Ok, trim0x } from '@catalogfi/utils';
import {
  APIResponse,
  Authorization,
  IAuth,
  Url,
  with0x,
} from '@gardenfi/utils';
import { AtomicSwapABI } from '../abi/atomicSwap';

export class EvmRelay implements IEVMRelay {
  private url: Url;
  private auth: IAuth;

  constructor(url: string | Url, auth: IAuth) {
    this.url = new Url('/relayer', url);
    this.auth = auth;
  }

  async init(
    walletClient: WalletClient,
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    if (!walletClient.account) return Err('No account found');
    if (
      walletClient.account.address.toLowerCase() !==
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
      const auth = await this.auth.getToken();
      if (auth.error) return Err(auth.error);

      const atomicSwap = getContract({
        address: with0x(order.source_swap.asset),
        abi: AtomicSwapABI,
        client: walletClient,
      });
      const token = await atomicSwap.read.token();

      const approval = await checkAllowanceAndApprove(
        Number(amount),
        token,
        order.source_swap.asset,
        walletClient,
      );
      if (approval.error) return Err(approval.error);

      const domain = await atomicSwap.read.eip712Domain();

      const signature = await walletClient.signTypedData({
        account: walletClient.account,
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
    try {
      const auth = await this.auth.getToken();
      if (auth.error) return Err(auth.error);

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: orderId,
            secret: trim0x(secret),
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
