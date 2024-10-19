import { AsyncResult } from '@catalogfi/utils';
import { BitcoinNetwork } from '@catalogfi/wallets';
import { IQuote, SecretManager, SwapParams } from '@gardenfi/core';
import { IOrderbook, MatchedOrder } from '@gardenfi/orderbook';
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
  pendingOrders?: number;
  quote?: IQuote;
  pendingOrdersCount?: number;
};

export type GardenProviderProps = {
  children: React.ReactNode;
  config: {
    orderBookUrl: string;
    quoteUrl: string;
    store: IStore;
    bitcoinNetwork: BitcoinNetwork;
    bitcoinRPCUrl?: string;
  };
};
