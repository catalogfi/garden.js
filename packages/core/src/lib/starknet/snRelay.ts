import { checkAllowanceAndApprove } from './checkAllowanceAndApprove';
import {
  Account,
  Contract,
  RpcProvider,
  TypedData,
  TypedDataRevision,
  WeierstrassSignatureType,
  cairo,
  num,
  shortString,
} from 'starknet';
import { MatchedOrder } from '@gardenfi/orderbook';
import { AsyncResult, Err, Ok, Fetcher } from '@catalogfi/utils';
import { APIResponse, Url, hexToU32Array } from '@gardenfi/utils';

const DOMAIN = {
  name: 'HTLC',
  version: shortString.encodeShortString('1'),
  chainId: '0x534e5f5345504f4c4941',
  revision: TypedDataRevision.ACTIVE,
};

const INTIATE_TYPE = {
  StarknetDomain: [
    { name: 'name', type: 'shortstring' },
    { name: 'version', type: 'shortstring' },
    { name: 'chainId', type: 'shortstring' },
    { name: 'revision', type: 'shortstring' },
  ],
  Initiate: [
    { name: 'redeemer', type: 'ContractAddress' },
    { name: 'amount', type: 'u256' },
    { name: 'timelock', type: 'u128' },
    { name: 'secretHash', type: 'u128*' },
  ],
};

export class SnRelay {
  private provider: RpcProvider;
  private url: Url;
  private nodeUrl: string;

  constructor(relayerUrl: string | Url, nodeUrl: string) {
    this.provider = new RpcProvider({
      nodeUrl: nodeUrl,
    });
    this.nodeUrl = nodeUrl;
    this.url = new Url('/relayer', relayerUrl);
  }

  async init(
    account: Account,
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    if (!account.address) return Err('No account address');

    const { create_order, source_swap } = order;
    const { redeemer, amount } = source_swap;

    if (
      !amount ||
      !redeemer ||
      !create_order.secret_hash ||
      !create_order.timelock
    ) {
      return Err('Invalid order');
    }

    try {
      const contract = new Contract(
        (await this.provider.getClassAt(order.source_swap.asset)).abi,
        order.source_swap.asset,
        account,
      );

      const token = await contract?.['token']();
      const tokenHex = num.toHex(token);
      const approvalResult = await checkAllowanceAndApprove(
        account,
        tokenHex,
        source_swap.asset,
        BigInt(amount),
        this.nodeUrl,
      );
      if (approvalResult.error) return Err(approvalResult.error);

      const TypedData: TypedData = {
        domain: DOMAIN,
        primaryType: 'Initiate',
        types: INTIATE_TYPE,
        message: {
          redeemer: redeemer,
          amount: cairo.uint256(amount),
          timelock: create_order.timelock,
          secretHash: hexToU32Array(create_order.secret_hash),
        },
      };
      const signature = (await account.signMessage(
        TypedData,
      )) as WeierstrassSignatureType;
      const { r, s } = signature;

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('initiate'),
        {
          body: JSON.stringify({
            order_id: create_order.create_id,
            signature: `0x${r.toString(16)},0x${s.toString(16)}`,
            perform_on: 'Source',
          }),
          headers: {
            'api-key':
              'AAAAAGf0dUU6OrzQU7BpPstIUl24NGKtyr_-fMJJ2LvTpPN8cK9X624gNTAZ4fFL2U8MwMWDwR5lSZzHBkUzR31OVmWBxEVDZzAc',
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('response after initiate on htlc', res);

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Init: No result found');
    } catch (error) {
      console.error('init error:', error);
      return Err(String(error));
    }
  }

  async redeem(orderId: string, secret: string): AsyncResult<string, string> {
    try {
      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: orderId,
            secret: secret,
            perform_on: 'Destination',
          }),
          headers: {
            'api-key':
              'AAAAAGf0dUU6OrzQU7BpPstIUl24NGKtyr_-fMJJ2LvTpPN8cK9X624gNTAZ4fFL2U8MwMWDwR5lSZzHBkUzR31OVmWBxEVDZzAc',
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
