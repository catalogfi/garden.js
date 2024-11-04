import { OrderWithStatus } from '@gardenfi/core';
import { AsyncResult } from '@catalogfi/utils';
import { BitcoinNetwork } from '@catalogfi/wallets';
import {
  IGardenJS,
  IQuote,
  ISecretManager,
  QuoteResponse,
  SecretManager,
  SwapParams,
} from '@gardenfi/core';
import { Asset, IOrderbook, MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';

export type GardenContextType = {
  orderBookUrl?: string;
  /**
   * Initializing secretManager is necessary for executing orders.
   * @returns {AsyncResult<SecretManager, string>} - The secret manager instance.
   */
  initializeSecretManager?: () => AsyncResult<SecretManager, string>;
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
  swap?: (params: SwapParams) => AsyncResult<MatchedOrder, string>;
  /**
   * Get all the pending orders of the user. This will return all the orders that are yet to be initiated, redeemed, or refunded.
   * It will not return orders that have expired (deadline expiry).
   * @returns {MatchedOrder[]} - The pending orders of the user.
   */
  pendingOrders?: OrderWithStatus[];
  /**
   * Get the quote for the given parameters. This will also return USD values of the assets.
   * @param params
   * @returns
   */
  getQuote?: (params: QuoteParams) => AsyncResult<QuoteResponse, string>;
  /**
   * The secret manager instance.
   * @returns {ISecretManager}
   */
  secretManager?: ISecretManager;
  /**
   * The garden instance.
   * @returns {IGardenJS}
   */
  garden?: IGardenJS;
  /**
   * Initiates the order in the EVM chain. This can be useful if the initiation is failed when `swap` function is called.
   * @param order - The order to initiate.
   * @returns {AsyncResult<MatchedOrder, string>} - The initiated order.
   * @NOTE This is only required if the source chain is EVM.
   */
  evmInitiate?: (order: MatchedOrder) => AsyncResult<MatchedOrder, string>;
  /**
   * Indicates if the orders are executing.
   */
  isExecuting: boolean;

  /**
   * The quote instance.
   * @returns {IQuote}
   */
  quote?: IQuote;
};

export type GardenProviderProps = {
  children: React.ReactNode;
  config: {
    orderBookUrl: string;
    quoteUrl: string;
    store: IStore;
    network: BitcoinNetwork;
    bitcoinRPCUrl?: string;
    blockNumberFetcherUrl?: string;
  };
};

export type QuoteParams = {
  fromAsset: Asset;
  toAsset: Asset;
  amount: number;
  isExactOut?: boolean;
};
