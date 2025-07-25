import { AsyncResult, IAuth, IStore } from '@gardenfi/utils';
import { Asset, BlockchainType, Chain } from '../asset';
import type { Calldata, RawArgs, TypedData } from 'starknet';

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
    order: CreateOrderRequest,
    auth: IAuth,
  ): AsyncResult<CreateOrderResponse, string>;

  /**
   * Get the order from orderbook based on provided Id and match status.
   * @param id - The create Id of the order
   * @template T - If true, returns matched order, else returns create order (unmatched Order).
   * @returns {AsyncResult<T extends true ? Order : CreateOrder, string>} A promise that resolves to the order.
   */
  getOrder(id: string): AsyncResult<Order, string>;

  /**
   * Get orders by status
   * @param address - The address of the order
   * @param status - The status of the order
   * @param paginationConfig - The pagination configuration
   * @returns {AsyncResult<PaginatedData<Order>, string>} A promise that resolves to the orders.
   */
  getOrdersByStatus(
    address: string,
    status: Status,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<PaginatedData<Order>, string>;

  /**
   * Get all orders from the orderbook based on the match status.
   * @param matched - If true, returns matched orders, else returns unmatched orders.
   * @param paginationConfig - The configuration for the pagination.
   * @param address - The address to get the orders for.
   * @param tx_hash - The tx hash to get the orders for (initiate_tx_hash, redeem_tx_hash, refund_tx_hash).
   * @param fromChain - The source chain to filter orders by.
   * @param toChain - The destination chain to filter orders by.
   * @returns {AsyncResult<PaginatedData<T extends true ? Order : CreateOrder>, string>} A promise that resolves to the orders.
   */
  getOrders(
    paginationConfig?: PaginationConfig,
    address?: string,
    tx_hash?: string,
  ): AsyncResult<PaginatedData<Order>, string>;

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
  subscribeOrders(
    account: string,
    interval: number,
    cb: (orders: PaginatedData<Order>) => Promise<void>,
    status?: Status,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void>;
}

export type DecodedAuthToken = {
  userWallet: string;
  exp: number;
  iat: number;
};

export type AffiliateFee = {
  address: string;
  asset: ChainAsset;
  fee: number; // fee in bps
};

export type AffiliateFeeWithAmount = AffiliateFee & {
  amount: string;
};

export type AffiliateFeeList<T extends AffiliateFee | AffiliateFeeWithAmount> =
  {
    affiliate_fees?: T[];
  };

export type AffiliateFeeOptionalAsset = Omit<AffiliateFee, 'asset'> &
  Partial<Pick<AffiliateFee, 'asset'>>;

export type OldCreateOrderRequest = {
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

export type ChainAsset = `${Chain}:${string}`;

export type CreateOrderRequest = {
  source: {
    asset: ChainAsset;
    owner: string;
    delegate: string | null;
    amount: string;
  };
  destination: {
    asset: ChainAsset;
    owner: string;
    delegate: string | null;
    amount: string;
  };
  slippage?: number;
  secret_hash?: string;
  nonce: number;
  affiliate_fees?: AffiliateFee[];
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
  delegate: string;
  asset_price: number;
  instant_refund_tx: string;
  initiate_timestamp: string;
  redeem_timestamp: string;
  refund_timestamp: string;
  current_confirmations: number;
};

export type Order = {
  order_id: string;
  created_at: string;
  source_swap: Swap;
  destination_swap: Swap;
  slippage: number;
  nonce: string;
  affiliate_fees: AffiliateFee[];
  integrator: string;
  version: string;
};

export type AssetHTLCInfo = {
  id: string;
  htlc: { address: string; schema: string } | null;
  token: { address: string; schema: string } | null;
  decimals: number;
  min_amount: string;
  max_amount: string;
  price: number;
};

export type PaginatedData<T> = {
  data: T[];
  page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
};

export type PaginationConfig = {
  page?: number;
  per_page?: number;
};

export type Status = 'all' | 'pending' | 'fulfilled';

export type EVMTransaction = {
  to: string;
  value: string;
  data: string;
  gas_limit: string;
  chain_id: number;
};

export type StarknetCall = {
  to: string;
  calldata?: RawArgs | Calldata;
  selector?: string;
};

export type BaseCreateOrderResponse = {
  order_id: string;
};

export type BitcoinOrderResponse = BaseCreateOrderResponse & {
  to: string;
  amount: number;
};

type WithTypedData<T, D> = T & { typed_data: D };

type EvmTypedData = {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
};

export type EvmOrderResponse = WithTypedData<
  BaseCreateOrderResponse & {
    approval_transaction: EVMTransaction | null;
    initiate_transaction: EVMTransaction;
  },
  EvmTypedData
>;

export type StarknetOrderResponse = WithTypedData<
  BaseCreateOrderResponse & {
    approval_call?: StarknetCall;
    initiate_call?: StarknetCall;
  },
  TypedData
>;

export type SolanaOrderResponse = BaseCreateOrderResponse & {
  versioned_tx: string;
};

export type CreateOrderResponse =
  | ({ type: BlockchainType.EVM } & EvmOrderResponse)
  | ({ type: BlockchainType.Bitcoin } & BitcoinOrderResponse)
  | ({ type: BlockchainType.Starknet } & StarknetOrderResponse)
  | ({ type: BlockchainType.Solana } & SolanaOrderResponse);
