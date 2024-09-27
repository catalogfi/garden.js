import { AsyncResult } from '@catalogfi/utils';
import { Asset, MatchedOrder } from '@gardenfi/orderbook';

export interface IEVMRelay {
  /**
   * Deposits funds to the EVM atomic swap contract using relay service.
   * Sends the signed transaction to the relay service.
   * @param order Matched Order
   * @param asset Asset
   * @param currentL1BlockNumber Current L1 block number. Used to calculate the swap expiry.
   * @NOTE send the current block number of the L1 chain even if the order is on L2 chain.
   * @returns txHash of Initiation
   */
  init(
    order: MatchedOrder,
    asset: Asset,
    currentL1BlockNumber: number,
  ): AsyncResult<string, string>;

  /**
   * Redeems funds from the EVM atomic swap contract using relay service.
   * Sends the secret to the relay service.
   * @param orderId Create order Id of the order
   * @param secret Secret of the HTLC generated when creating the order
   */
  redeem(orderId: string, secret: string): AsyncResult<string, string>;
}
