import { AsyncResult } from '@catalogfi/utils';
import { Asset, MatchedOrder } from '@gardenfi/orderbook';
import { IOrderExecutor } from '../orderExecutor/orderExecutor.types';

export type SwapParams = {
  /**
   * Asset to be sent.
   */
  fromAsset: Asset;
  /**
   * Asset to be received.
   */
  toAsset: Asset;
  /**
   * Amount in lowest denomination of the asset.
   */
  sendAmount: string;
  /**
   * Amount in lowest denomination of the asset.
   */
  receiveAmount: string;
  /**
   * EVM - The address from the which the user is sending funds from.
   *
   * Bitcoin - Provide public key if the source chain is bitcoin.
   */
  sendAddress: string;
  /**
   * EVM - The address at which the user wants to receive funds.
   *
   * Bitcoin - Provide public key if the destination chain is bitcoin.
   */
  receiveAddress: string;
  /**
   * Time lock for the swap.
   */
  timelock?: number;
  /**
   * This will wait for the specified number of confirmations before redeeming the funds.
   */
  minDestinationConfirmations?: number;
  /**
   * Additional data for the order.
   */
  additionalData: {
    /**
     * Get strategy id from the quote
     */
    strategyId: string;
    /**
     * Provide btcAddress if the destination or source chain is bitcoin. This address is used as refund address if source chain is bitcoin, and as redeem address if destination chain is bitcoin.
     */
    btcAddress?: string;
  };
};

export enum TimeLocks {
  evm = 14400,
  btc = 288,
}

export interface IGardenJS {
  /**
   * Create Order
   * @param {SwapParams} - The parameters for creating the order.
   */
  swap(params: SwapParams): AsyncResult<MatchedOrder, string>;
  /**
   * Subscribe to orders. This will poll the orderbook and call callback for each order.
   * @param cb - Callback function to be called for each order. This callback will take orderExecutor as an argument.
   * @param interval - Polling interval in milliseconds.
   */
  subscribeOrders(
    cb: (orderExecutor: IOrderExecutor) => Promise<void>,
    interval?: number,
  ): Promise<() => void>;
}
