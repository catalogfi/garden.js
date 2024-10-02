import { WalletClient } from 'viem';
import { AsyncResult } from '@catalogfi/utils';
import { APIResponse, IStore } from '@gardenfi/utils';
import { Asset, Chain } from '../asset';
import { IOrderProvider } from '../orders/orders.types';

/**
 * Configuration for creating an order
 */
export interface CreateOrderConfig {
  /**
   * The asset the user wants to send.
   */
  fromAsset: Asset;
  /**
   * The asset the user wants to receive.
   */
  toAsset: Asset;
  /**
   * The address from the which the user is sending funds from.
   */
  sendAddress: string;
  /**
   * The address at which the user wants to receive funds.
   */
  receiveAddress: string;
  /**
   * The input amount the user wants to send in it's lowest denomination
   */
  sendAmount: string;
  /**
   * The amount you receive amount
   */
  receiveAmount: string;
  /**
   * The hash of the secret the user wants to use for the swap.
   */
  secretHash: string;
  /**
   * The time lock for the swap. (current blocknumber + 48 hours)
   * @NOTE 7200 blocks per day in ethereum.
   * @NOTE 144 blocks per day in bitcoin.
   */
  timelock: number;
  /**
   * The nonce for the order.
   * This is used for secret generation.
   */
  nonce: string;
  /**
   * The address of the user's btc wallet. The funds will be sent to this address in case of a redeem or refund.
   * @NOTE This is only required if the destination chain is bitcoin.
   */
  btcInputAddress?: string;
  /**
   * The min number of confirmations required for the user before redeeming in the destination chain.
   * @default 0
   */
  minDestinationConfirmations?: number;
}

/**
 * Additional configuration options for the orderbook
 *
 */
export type OrderbookOpts = {
  /**
   * The domain of your dApp. Optional.
   */
  domain?: string;
  /**
   * The store used for storing the auth token. Optional.
   */
  store?: IStore;
};

/**
 * Interface for the configuration of an Orderbook.
 */
export interface OrderbookConfig {
  url?: string;
  walletClient: WalletClient;
  opts?: OrderbookOpts;
}

/**
 * Configuration for the orders you want to receive
 */
export type OrderConfig = {
  isPending: boolean;
  pagination?: {
    page?: number;
    /**
     * default is 10
     */
    per_page?: number;
  };
};

export interface IOrderbook extends IOrderProvider {
  /**
   * Creates an order
   * @param {CreateOrderConfig} orderConfig - The configuration for the creating the order.
   * @returns {number} The create order ID.
   */
  createOrder(orderConfig: CreateOrderConfig): AsyncResult<string, string>;

  /**
   * Wrapper for the getOrder method in the OrdersProvider class to abstract the address parameter.
   * @param matched - Whether to get matched or unmatched orders
   * @param paginationConfig - The pagination configuration
   * @param pending - Whether to get pending orders
   * @returns {AsyncResult<PaginatedData<T extends true ? MatchedOrder : CreateOrder>, string>}
   */
  fetchOrders<T extends boolean>(
    matched: T,
    pending?: boolean,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<
    PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    string
  >;

  /**
   * Wrapper for the subscribeOrders method in the OrdersProvider class to abstract the address parameter.
   * @param matched - Whether to get matched or unmatched orders
   * @param interval - The interval to poll for updates
   * @param cb - The callback to be called when the orders are updated
   * @param paginationConfig - The configuration for the pagination
   * @returns {() => void} A function to unsubscribe from the order updates
   */
  subscribeToOrders<T extends boolean>(
    matched: T,
    interval: number,
    cb: (
      orders: PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    ) => void,
    pending?: boolean,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void>;

  /**
   * Get the current orders count associated with the provided address. Used to calculate nonce for secret generation.
   * @returns {AsyncResult<number, string>} A promise that resolves to the orders count.
   */
  getUserOrdersCount(): AsyncResult<number, string>;
}

export type DecodedAuthToken = {
  userWallet: string;
  exp: number;
  iat: number;
};

export type Orders = {
  unmatched: PaginatedData<CreateOrder[]>;
  matched: PaginatedData<MatchedOrder[]>;
};

export type CreateOrderRequest = {
  source_chain: string;
  destination_chain: string;
  source_asset: string;
  destination_asset: string;
  initiator_source_address: string;
  initiator_destination_address: string;
  source_amount: string; // BigDecimal as string
  destination_amount: string; // BigDecimal as string
  fee: string; // BigDecimal as string
  nonce: string; // BigDecimal as string
  min_destination_confirmations: number;
  timelock: number;
  secret_hash: string;
  additional_data?: {
    bitcoin_optional_recipient: string;
  };
};

export type CreateOrder = CreateOrderRequest & {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  create_id: string;
  block_number: string;
};

export type Swap = {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  swap_id: string;
  chain: Chain;
  asset: string;
  initiator: string;
  redeemer: string;
  timelock: number;
  filled_amount: string;
  amount: string;
  secret_hash: string;
  secret: string;
  initiate_tx_hash: string;
  redeem_tx_hash: string;
  refund_tx_hash: string;
  initiate_block_number: string | null;
  redeem_block_number: string | null;
  refund_block_number: string | null;
};

export type MatchedOrder = {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  source_swap: Swap;
  destination_swap: Swap;
  create_order: CreateOrder;
};

export type PaginatedData<T> = {
  data: T[];
  page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
};

export type CreateOrderResponse = APIResponse<string>;

export type PaginationConfig = {
  page?: number;
  per_page?: number;
};
