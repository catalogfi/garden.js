import { AsyncResult } from '@catalogfi/utils';
import { BitcoinNetwork } from '@catalogfi/wallets';
import {
  IGardenJS,
  ISecretManager,
  QuoteResponse,
  SecretManager,
  SwapParams,
} from '@gardenfi/core';
import { Asset, IOrderbook, MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';

export type GardenContextType = {
  orderBookUrl?: string;
  initializeSecretManager?: () => AsyncResult<SecretManager, string>;
  orderBook?: IOrderbook | undefined;
  /**
   * Create an order and wait until its matched and then initiates if source chain is EVM.
   * @params {SwapParams} - The parameters for creating the order.
   * @returns {AsyncResult<string, string>} - create order ID.
   */
  swap?: (params: SwapParams) => AsyncResult<MatchedOrder, string>;
  pendingOrders?: MatchedOrder[];
  getQuote?: (params: QuoteParams) => AsyncResult<QuoteResponse, string>;
  secretManager?: ISecretManager;
  garden?: IGardenJS;
  evmInitiate?: (order: MatchedOrder) => AsyncResult<MatchedOrder, string>;
  isExecuting: boolean;
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
