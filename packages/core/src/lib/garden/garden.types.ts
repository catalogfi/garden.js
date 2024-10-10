import { AsyncResult } from '@catalogfi/utils';
import { Asset } from '@gardenfi/orderbook';
import { IOrderExecutor } from '../orderExecutor/orderExecutor.types';

export type SwapParams = {
  fromAsset: Asset;
  toAsset: Asset;
  sendAmount: string;
  receiveAmount: string;
  sendAddress: string;
  receiveAddress: string;
  timelock?: number;
  minDestinationConfirmations?: number;
  additionalData?: { btcAddress: string };
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
  swap(params: SwapParams): AsyncResult<string, string>;
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
