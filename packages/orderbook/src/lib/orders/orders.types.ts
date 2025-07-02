import { AsyncResult } from '@gardenfi/utils';
import {
  CreateOrder,
  MatchedOrder,
  PaginatedData,
  PaginationConfig,
} from '../orderbook/orderbook.types';

export interface IOrderProvider {
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
    pending: boolean,
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
   * @returns {AsyncResult<PaginatedData<T extends true ? MatchedOrder : CreateOrder>, string>} A promise that resolves to the orders.
   */
  getOrders<T extends boolean>(
    matched: T,
    paginationConfig?: PaginationConfig,
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
    pending?: boolean,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void>;

  /**
   * Returns the current orders count associated with the provided address. Used to calculate nonce for secret generation.
   * @param address The address to get the orders count for.
   * @returns {AsyncResult<number, string>} A promise that resolves to the orders count.
   */
  getOrdersCount(address: string): AsyncResult<number, string>;
}
