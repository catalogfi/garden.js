import { MatchedOrder } from '@gardenfi/orderbook';
import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { Account, cairo, Contract, num, CallData } from 'starknet';
import { hexToU32Array } from '@gardenfi/utils';
import { TokenABI } from '../abi/starknetTokenABI';
import { IStarknetHTLC } from '../starknetHTLC.types';
import { checkAllowanceAndApprove } from '../checkAllowanceAndApprove';
import { starknetHtlcABI } from '../abi/starknetHtlcABI';

const DEFAULT_NODE_URL = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

export class StarknetHTLC implements IStarknetHTLC {
  private nodeUrl: string;
  private account: Account;

  constructor(account: Account, nodeUrl?: string) {
    this.nodeUrl = nodeUrl || DEFAULT_NODE_URL;
    this.account = account;
  }

  get htlcActorAddress(): string {
    return this.account.address;
  }

  private async getHTLCContract(
    order: MatchedOrder,
    isRedeeming: boolean = false,
  ) {
    const assetAddress = isRedeeming
      ? order.destination_swap.asset
      : order.source_swap.asset;
    const contract = new Contract(starknetHtlcABI, assetAddress, this.account);
    return contract;
  }

  /**
   * Initiates the HTLC
   * @param order Order to initiate HTLC for
   * @returns Transaction ID
   */
  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    try {
      const htlcContract = await this.getHTLCContract(order);

      const token = await htlcContract['token']();
      if (!token) {
        throw new Error('Token address retrieval failed');
      }

      const tokenHex = num.toHex(token);
      const amountUint256 = cairo.uint256(BigInt(order.source_swap.amount));
      // Check allowance
      try {
        const approvalResult = await checkAllowanceAndApprove(
          this.account,
          tokenHex,
          order.source_swap.asset,
          BigInt(order.source_swap.amount),
          this.nodeUrl,
        );
        if (approvalResult.error) return Err(approvalResult.error);
      } catch (error) {
        return Err(`Allowance check failed: ${error}`);
      }

      const initiateResponse = await this.account.execute({
        contractAddress: order.source_swap.asset,
        entrypoint: 'initiate',
        calldata: [
          order.source_swap.redeemer,
          BigInt(order.source_swap.timelock),
          amountUint256.low,
          amountUint256.high,
          ...hexToU32Array(order.create_order.secret_hash),
        ],
      });

      if (!initiateResponse.transaction_hash) {
        throw new Error('Failed to initiate HTLC transaction');
      }

      return Ok(initiateResponse.transaction_hash);
    } catch (error) {
      return Err(`HTLC Initiation Error: ${error}`);
    }
  }
  callData = new CallData(TokenABI);

  /**
   * Redeems the HTLC
   *
   * @param order Order to redeem HTLC for
   * @param secret Secret to redeem HTLC with
   * @returns Transaction ID
   */
  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const htlcContract = await this.getHTLCContract(order, true);
      const swapId = order.create_order.source_chain.includes('starknet')
        ? order.source_swap.swap_id
        : order.destination_swap.swap_id;
      const redeemResponse = await this.account.execute({
        contractAddress: htlcContract.address,
        entrypoint: 'redeem',
        calldata: CallData.compile({
          swap_id: swapId,
          secret: hexToU32Array(secret),
        }),
      });
      if (!redeemResponse.transaction_hash) {
        return Err('Failed to redeem HTLC transaction');
      }
      return Ok(redeemResponse.transaction_hash);
    } catch (error) {
      return Err(`HTLC Redeem Error`);
    }
  }

  /**
   * Refunds the HTLC
   *
   * @param order Order to refund HTLC for
   * @returns Refund transaction ID
   */
  async refund(order: MatchedOrder): AsyncResult<string, string> {
    try {
      const swapId = order.create_order.source_chain.includes('starknet')
        ? order.source_swap.swap_id
        : order.destination_swap.swap_id;
      const htlcContract = await this.getHTLCContract(order);
      const refundResponse = await this.account.execute({
        contractAddress: htlcContract.address,
        entrypoint: 'refund',
        calldata: {
          orderId: swapId,
        },
      });
      if (!refundResponse.transaction_hash) {
        return Err('Failed to refund HTLC transaction');
      }

      return Ok(refundResponse.transaction_hash);
    } catch (error) {
      return Err(`HTLC Refund Error`);
    }
  }
}
