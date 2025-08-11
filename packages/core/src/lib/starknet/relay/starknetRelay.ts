import { isAllowanceSufficient } from '../checkAllowanceAndApprove';
import {
  AccountInterface,
  Call,
  Contract,
  RpcProvider,
  TransactionExecutionStatus,
  TypedData,
  TypedDataRevision,
  cairo,
  num,
  shortString,
} from 'starknet';
import { Order, StarknetOrderResponse } from '@gardenfi/orderbook';
import {
  APIResponse,
  AsyncResult,
  Err,
  Fetcher,
  Network,
  Ok,
  Url,
  hexToU32Array,
  with0x,
} from '@gardenfi/utils';
import { IStarknetHTLC } from '../starknetHTLC.types';
import { starknetHtlcABI } from '../abi/starknetHtlcABI';
import { formatStarknetSignature } from '../../utils';
import { STARKNET_CONFIG } from './../../constants';

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

export class StarknetRelay implements IStarknetHTLC {
  private url: Url;
  private account: AccountInterface;
  private starknetProvider: RpcProvider;
  private chainId: string;

  constructor(
    relayerUrl: string | Url,
    account: AccountInterface,
    network: Network,
    nodeUrl?: string,
  ) {
    this.url = relayerUrl instanceof Url ? relayerUrl : new Url(relayerUrl);
    this.account = account;
    this.starknetProvider = new RpcProvider({
      nodeUrl: nodeUrl || STARKNET_CONFIG[network].nodeUrl,
    });
    this.chainId = STARKNET_CONFIG[network].chainId;
  }

  get htlcActorAddress(): string {
    if (!this.account.address) throw new Error('No account found');
    return this.account.address;
  }

  async initiate(order: Order): AsyncResult<string, string> {
    if (!this.account.address) return Err('No account address');
    const { source_swap } = order;
    const { redeemer, amount } = source_swap;

    if (
      !amount ||
      !redeemer ||
      !source_swap.secret_hash ||
      !source_swap.timelock
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
      const _isAllowanceSufficient = await isAllowanceSufficient(
        this.account.address,
        tokenHex,
        source_swap.asset,
        this.starknetProvider,
        BigInt(source_swap.amount),
      );
      if (_isAllowanceSufficient.error) {
        return Err(_isAllowanceSufficient.error);
      }

      if (_isAllowanceSufficient.val) return this.initiateRelay(order);
      else return this.approveAndInitiate(tokenHex, order);
    } catch (error) {
      return Err(String(error));
    }
  }

  private async approveAndInitiate(
    tokenAddress: string,
    order: Order,
  ): AsyncResult<string, string> {
    const { source_swap } = order;
    const { redeemer, amount } = source_swap;
    const { secret_hash, timelock } = source_swap;
    const contractAddress = source_swap.asset;

    try {
      const amountUint256 = cairo.uint256(BigInt(amount));
      const approvalCall: Call = {
        contractAddress: with0x(tokenAddress),
        entrypoint: 'approve',
        calldata: [contractAddress, amountUint256.low, amountUint256.high],
      };

      const _amount = cairo.uint256(amount);

      const initiateCall: Call = {
        contractAddress: with0x(contractAddress),
        entrypoint: 'initiate',
        calldata: [
          redeemer,
          timelock.toString(),
          _amount.low.toString(),
          _amount.high.toString(),
          ...hexToU32Array(secret_hash),
        ],
      };

      const tx = await this.account.execute([approvalCall, initiateCall]);

      await this.starknetProvider.waitForTransaction(tx.transaction_hash, {
        retryInterval: 2000,
        successStates: [TransactionExecutionStatus.SUCCEEDED],
      });

      return Ok(tx.transaction_hash);
    } catch (error) {
      return Err(`Failed to approve and initiate: ${String(error)}`);
    }
  }

  private async initiateRelay(order: Order): AsyncResult<string, string> {
    const { source_swap } = order;
    const { redeemer, amount } = source_swap;
    if (!create_order.secret_hash) {
      return Err('Invalid order: secret_hash is undefined');
    }
    const secretHash = with0x(create_order.secret_hash);
    const DOMAIN = {
      name: 'HTLC',
      version: shortString.encodeShortString('1'),
      chainId: this.chainId,
      revision: TypedDataRevision.ACTIVE,
    };

    const TypedData: TypedData = {
      domain: DOMAIN,
      primaryType: 'Initiate',
      types: INITIATE_TYPE,
      message: {
        redeemer: redeemer,
        amount: cairo.uint256(amount),
        timelock: order.source_swap.timelock,
        secretHash: hexToU32Array(order.source_swap.secret_hash),
      },
    };
    try {
      const signature = await this.account.signMessage(TypedData);
      const formattedSignature = formatStarknetSignature(signature);
      if (formattedSignature.error) {
        return Err(formattedSignature.error);
      }

      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('initiate'),
        {
          body: JSON.stringify({
            order_id: order.order_id,
            signature: formattedSignature.val,
            perform_on: 'Source',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          retryCount: 10,
          retryDelay: 2000,
        },
      );
      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Init: No result found');
    } catch (error) {
      return Err(`Failed to initiate relayer: ${String(error)}`);
    }
  }

  async redeem(order: Order, secret: string): AsyncResult<string, string> {
    try {
      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: order.order_id,
            secret: secret,
            perform_on: 'Destination',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          retryCount: 10,
          retryDelay: 2000,
        },
      );

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Redeem: No result found');
    } catch (error) {
      return Err(String(error));
    }
  }

  async executeApprovalTransaction(
    order: StarknetOrderResponse,
  ): AsyncResult<string, string> {
    if (!this.account.address) return Err('No account address');

    if (!order.approval_call) {
      return Ok('No approval transaction required');
    }

    try {
      const approvalTx = order.approval_call;

      const txHash = await this.account.execute([
        {
          contractAddress: with0x(approvalTx.to),
          entrypoint: approvalTx.selector as string,
          calldata: approvalTx.calldata,
        },
      ]);

      await this.starknetProvider.waitForTransaction(txHash.transaction_hash, {
        retryInterval: 2000,
        successStates: [TransactionExecutionStatus.SUCCEEDED],
      });

      return Ok(txHash.transaction_hash);
    } catch (error: any) {
      console.error('executeApprovalTransaction error:', error);
      return Err(
        'Failed to execute approval: ' + (error?.message || String(error)),
      );
    }
  }

  async initiateWithCreateOrderResponse(
    order: StarknetOrderResponse,
  ): AsyncResult<string, string> {
    if (!this.account.address) return Err('No account address');
    const { typed_data } = order;
    const signature = await this.account.signMessage(typed_data);
    const formattedSignature = formatStarknetSignature(signature);
    if (formattedSignature.error) {
      return Err(formattedSignature.error);
    }

    const res = await Fetcher.patch<APIResponse<string>>(
      this.url
        .endpoint('/v2/orders')
        .endpoint(order.order_id)
        .addSearchParams({ action: 'initiate' }),
      {
        body: JSON.stringify({
          signature: formattedSignature.val,
        }),
      },
    );
    if (res.error) return Err(res.error);
    return Ok(res.result as string);
  }

  async refund(): AsyncResult<string, string> {
    return Err('Refund is taken care of by the relayer');
  }
}
