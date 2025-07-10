import { AsyncResult } from '@catalogfi/utils';
import { APIResponse, IAuth, IStore } from '@gardenfi/utils';
import { Asset, Chain } from '../asset';

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

export interface IOrderbook {
  /**
   * Creates an order
   * @param {CreateOrderConfig} orderConfig - The configuration for the creating the order.
   * @returns {number} The create order ID.
   */
  createOrder(
    order: CreateOrderRequestWithAdditionalData,
    auth: IAuth,
  ): AsyncResult<string, string>;

  /**
   * Get the order from orderbook based on provided Id and match status.
   * @param id - The create Id of the order
   * @template T - If true, returns matched order, else returns create order (unmatched Order).
   * @returns {AsyncResult<T extends true ? MatchedOrder : CreateOrder, string>} A promise that resolves to the order.
   */
  getOrder<T extends boolean>(
    id: string,
    matched: T,
  ): AsyncResult<T extends true ? MatchedOrder : CreateOrder, string>;

  /**
   * Get all matched orders from the orderbook associated with the `address`.
   * @param address The address to get the orders for.
   * @param pending If true, returns pending orders, else returns all matched orders.
   * @param paginationConfig - The configuration for the pagination.
   * @returns {AsyncResult<PaginatedData<MatchedOrder>, string>} A promise that resolves to the orders.
   */
  getMatchedOrders(
    address: string,
    status: Status,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<PaginatedData<MatchedOrder>, string>;

  /**
   * Get all unmatched orders from the orderbook associated with the `address`.
   * @param address The address to get the orders for.
   * @param paginationConfig - The configuration for the pagination.
   * @returns {AsyncResult<PaginatedData<CreateOrder>, string>} A promise that resolves to the orders.
   */
  getUnMatchedOrders(
    address: string,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<PaginatedData<CreateOrder>, string>;

  /**
   * Get all orders from the orderbook based on the match status.
   * @param matched - If true, returns matched orders, else returns unmatched orders.
   * @param paginationConfig - The configuration for the pagination.
   * @param address - The address to get the orders for.
   * @param tx_hash - The tx hash to get the orders for (initiate_tx_hash, redeem_tx_hash, refund_tx_hash).
   * @param fromChain - The source chain to filter orders by.
   * @param toChain - The destination chain to filter orders by.
   * @returns {AsyncResult<PaginatedData<T extends true ? MatchedOrder : CreateOrder>, string>} A promise that resolves to the orders.
   */
  getOrders<T extends boolean>(
    matched: T,
    paginationConfig?: PaginationConfig,
    address?: string,
    tx_hash?: string,
  ): AsyncResult<
    PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    string
  >;

  /**
   * Polls for every provided interval and returns matched and unmatched orders associated on the account.
   * @param account The account to subscribe to
   * @param matched If true, returns matched orders, else returns unmatched orders
   * @param cb Th ack to be called when the orders are updated
   * @param interval The interval to poll for updates
   *
   * Example usage:
   *
   * ```js
   * const unsubscribe =await orderbook.subscribeOrders(account, matched, interval, handleOrders, paginationConfig);
   *
   * // Unsubscribe after 20 seconds
   * setTimeout(() => {
   *   unsubscribe();
   *   console.log('Unsubscribed from orders');
   * }, 20000);
   * ```
   */
  subscribeOrders<T extends boolean>(
    account: string,
    matched: T,
    interval: number,
    cb: (
      orders: PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    ) => Promise<void>,
    status?: Status,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void>;

  /**
   * Returns the current orders count associated with the provided address. Used to calculate nonce for secret generation.
   * @param address The address to get the orders count for.
   * @returns {AsyncResult<number, string>} A promise that resolves to the orders count.
   */
  getOrdersCount(address: string): AsyncResult<number, string>;
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

export type AdditionalData = {
  additional_data: {
    strategy_id: string;
    sig: string;
    input_token_price: number;
    output_token_price: number;
    deadline: number;
    bitcoin_optional_recipient?: string;
    [key: string]: any;
  };
};

export type AdditionalDataWithStrategyId = {
  additional_data: {
    strategy_id: string;
    bitcoin_optional_recipient?: string;
    [key: string]: any;
  };
};

export type CreateOrderReqWithStrategyId = CreateOrderRequest &
  AdditionalDataWithStrategyId &
  AffiliateFeeList<AffiliateFee>;

export type AffiliateFee = {
  fee: number; // fee in bps
  address: string;
  chain: string;
  asset: string;
};

export type AffiliateFeeWithAmount = AffiliateFee & {
  amount: string;
};

export type AffiliateFeeList<T extends AffiliateFee | AffiliateFeeWithAmount> =
  {
    affiliate_fees?: T[];
  };

export type AffiliateFeeOptionalChainAsset = Omit<
  AffiliateFee,
  'chain' | 'asset'
> &
  Partial<Pick<AffiliateFee, 'chain' | 'asset'>>;

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
};

export type CreateOrderRequestWithAdditionalData = CreateOrderRequest &
  AdditionalData &
  AffiliateFeeList<AffiliateFeeWithAmount>;

export type CreateOrder = CreateOrderRequestWithAdditionalData & {
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
  required_confirmations: number;
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

export type Status = 'all' | 'pending' | 'fulfilled';
