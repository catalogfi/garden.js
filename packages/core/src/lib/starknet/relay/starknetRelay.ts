import { checkAllowanceAndApprove } from '../checkAllowanceAndApprove';
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
import { APIResponse, IAuth, Url, hexToU32Array } from '@gardenfi/utils';
import { IStarknetHTLC } from '../starknetHTLC.types';
import { starknetHtlcABI } from '../abi/starknetHtlcABI';

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

const DEFAULT_NODE_URL = 'https://starknet-mainnet.public.blastapi.io';

export class StarknetRelay implements IStarknetHTLC {
  private provider: RpcProvider;
  private url: Url;
  private nodeUrl: string;
  private account: Account;
  private auth: IAuth;

  constructor(
    relayerUrl: string | Url,
    account: Account,
    auth: IAuth,
    nodeUrl?: string,
  ) {
    this.provider = new RpcProvider({
      nodeUrl: nodeUrl,
    });
    this.nodeUrl = nodeUrl || DEFAULT_NODE_URL;
    this.url = new Url('/relayer', relayerUrl);
    this.account = account;
    this.auth = auth;
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
      const auth = await this.auth.getAuthHeaders();
      if (auth.error) return Err(auth.error);
      const contract = new Contract(
        starknetHtlcABI,
        order.source_swap.asset,
        this.account,
      );

      const token = await contract?.['token']();
      const tokenHex = num.toHex(token);

      try {
        const approvalResult = await checkAllowanceAndApprove(
          this.account,
          tokenHex,
          source_swap.asset,
          BigInt(amount),
          this.nodeUrl,
        );
        if (approvalResult.error) return Err(approvalResult.error);
      } catch (error) {
        return Err(`Allowance check failed: ${error}`);
      }
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

      const signature = (await this.account.signMessage(
        TypedData,
      )) as WeierstrassSignatureType;
      const { r, s } = signature;

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('initiate'),
        {
          body: JSON.stringify({
            order_id: create_order.create_id,
            signature: {
              r: r.toString(),
              s: s.toString(),
            },
            perform_on: 'Source',
          }),
          headers: {
            ...auth.val,
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Init: No result found');
    } catch (error) {
      console.error('init error:', error);
      return Err(String(error));
    }
  }

  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const auth = await this.auth.getAuthHeaders();
      if (auth.error) return Err(auth.error);

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: order.create_order.create_id,
            secret: secret,
            perform_on: 'Destination',
          }),
          headers: {
            ...auth.val,
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
