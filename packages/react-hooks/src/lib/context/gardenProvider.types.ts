import { OrderWithStatus } from '@gardenfi/core';
import { IGardenJS, QuoteResponse, SwapParams } from '@gardenfi/core';
import { Asset, IOrderbook, MatchedOrder } from '@gardenfi/orderbook';
import { GardenConfigWithHTLCs, GardenConfigWithWallets } from '@gardenfi/core';
import { AsyncResult, Result } from '@gardenfi/utils';

export type GardenContextType = {
  /**
   * The orderbook instance.
   * @returns {IOrderbook}
   */
  orderBook?: IOrderbook | undefined;
  /**
   * Create an order and wait until its matched and then initiates if source chain is EVM.
   * @params {SwapParams} - The parameters for creating the order.
   * @returns {AsyncResult<string, string>} - create order ID.
   */
  swapAndInitiate?: (params: SwapParams) => AsyncResult<MatchedOrder, string>;
  /**
   * Get all the pending orders of the user. This will return all the orders that are yet to be initiated, redeemed, or refunded.
   * It will not return orders that have expired (deadline expiry).
   * @returns {MatchedOrder[]} - The pending orders of the user.
   */
  pendingOrders: OrderWithStatus[];
  /**
   * Get the quote for the given parameters. This will also return USD values of the assets.
   * @param params
   * @returns
   */
  getQuote?: (
    params: QuoteParams,
  ) => Promise<Result<QuoteResponse, string> | undefined>;
  /**
   * The garden instance.
   * @returns {IGardenJS}
   */
  garden?: IGardenJS;
};

export type GardenProviderProps = {
  children: React.ReactNode;
  config:
    | Omit<GardenConfigWithHTLCs, 'digestKey'>
    | Omit<GardenConfigWithWallets, 'digestKey'>;
};

export type QuoteParams = {
  fromAsset: Asset;
  toAsset: Asset;
  amount: number;
  isExactOut?: boolean;
  options?: {
    affiliateFee?: number;
    request?: Request;
  };
};
