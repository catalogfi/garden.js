import { checkAllowanceAndApprove } from '../checkAllowanceAndApprove';
import {
  AccountInterface,
  Contract,
  TypedData,
  TypedDataRevision,
  cairo,
  num,
  shortString,
} from 'starknet';
import { MatchedOrder } from '@gardenfi/orderbook';
import { AsyncResult, Err, Ok, Fetcher } from '@catalogfi/utils';
import { APIResponse, Url, hexToU32Array } from '@gardenfi/utils';
import { IStarknetHTLC } from '../starknetHTLC.types';
import { starknetHtlcABI } from '../abi/starknetHtlcABI';
import { formatStarknetSignature } from 'src/lib/utils';

const DOMAIN = {
  name: 'HTLC',
  version: shortString.encodeShortString('1'),
  chainId: '0x534e5f5345504f4c4941',
  revision: TypedDataRevision.ACTIVE,
};

const INITIATE_TYPE = {
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

const DEFAULT_NODE_URL = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

export class StarknetRelay implements IStarknetHTLC {
  private url: Url;
  private nodeUrl: string;
  private account: AccountInterface;

  constructor(
    relayerUrl: string | Url,
    account: AccountInterface,
    nodeUrl?: string,
  ) {
    this.nodeUrl = nodeUrl || DEFAULT_NODE_URL;
    this.url = new Url('/', relayerUrl);
    this.account = account;
  }

  get htlcActorAddress(): string {
    if (!this.account.address) throw new Error('No account found');
    return this.account.address;
  }

  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    if (!this.account.address) return Err('No account address');
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
        starknetHtlcABI,
        order.source_swap.asset,
        this.account,
      );

      const token = await contract?.['token']();
      const tokenHex = num.toHex(token);
      const approvalResult = await checkAllowanceAndApprove(
        this.account,
        tokenHex,
        source_swap.asset,
        BigInt(amount),
        this.nodeUrl,
      );
      if (approvalResult.error) return Err(approvalResult.error);

      const TypedData: TypedData = {
        domain: DOMAIN,
        primaryType: 'Initiate',
        types: INITIATE_TYPE,
        message: {
          redeemer: redeemer,
          amount: cairo.uint256(amount),
          timelock: create_order.timelock,
          secretHash: hexToU32Array(create_order.secret_hash),
        },
      };

      const signature = await this.account.signMessage(TypedData);
      // const { r, s } = signature;
      // const r = signature[1];
      // const s = signature[2];
      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('initiate'),
        {
          body: JSON.stringify({
            order_id: create_order.create_id,
            signature: formatStarknetSignature(signature),
            perform_on: 'Source',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Init: No result found');
    } catch (error) {
      return Err(String(error));
    }
  }

  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: order.create_order.create_id,
            secret: secret,
            perform_on: 'Destination',
          }),
          headers: {
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
    return Err('Refund is taken care of by the relayer');
  }
}
