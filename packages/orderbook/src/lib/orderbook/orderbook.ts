import { WalletClient } from 'viem';
import { AsyncResult, Fetcher, Ok, Err, Result } from '@catalogfi/utils';
import {
  CreateOrder,
  CreateOrderRequestWithAdditionalData,
  CreateOrderResponse,
  IOrderbook,
  MatchedOrder,
  OrderbookConfig,
  PaginatedData,
  PaginationConfig,
} from './orderbook.types';
import { MAINNET_ORDERBOOK_API } from '../api';
import { Authorization, IAuth, Url } from '@gardenfi/utils';
import { OrdersProvider } from '../orders/ordersProvider';

/**
 * A class that allows you to create and manage orders with the orderbook url.
 * @class
 * @extends {OrdersProvider}
 * @implements {IOrderbook}
 */
export class Orderbook extends OrdersProvider implements IOrderbook {
  private Url: Url;
  private auth: IAuth;
  private walletClient: WalletClient;

  /**
   * Creates an instance of Orderbook. Does not login to the orderbook.
   * @constructor
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   */
  constructor(orderbookConfig: OrderbookConfig) {
    const url = new Url(
      '/relayer',
      orderbookConfig.url ?? MAINNET_ORDERBOOK_API,
    );
    super(url);

    this.Url = url;
    this.walletClient = orderbookConfig.walletClient;

    this.auth = orderbookConfig.auth;
  }

  /**
   * Initializes the orderbook as well as logs in the orderbook (fetches the auth token).
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   */
  static async init(orderbookConfig: OrderbookConfig) {
    await orderbookConfig.auth.getToken();

    return new Orderbook(orderbookConfig);
  }

  /**
   * Creates an order
   * @param {CreateOrderConfig} createOrderConfig - The configuration for the creating the order.
   * @returns {string} The create order ID.
   */
  async createOrder(
    order: CreateOrderRequestWithAdditionalData,
  ): AsyncResult<string, string> {
    const auth = await this.auth.getToken();
    if (auth.error) return Err(auth.error);

    try {
      const res = await Fetcher.post<CreateOrderResponse>(
        this.Url.endpoint('create-order'),
        {
          body: JSON.stringify(order),
          headers: {
            Authorization: Authorization(auth.val),
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('CreateOrder: Unexpected error, result is undefined');
    } catch (error) {
      return Err('CreateOrder:', String(error));
    }
  }

  async fetchOrders<T extends boolean>(
    matched: T,
    pending: boolean = false,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<
    PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    string
  > {
    const address = this.walletClient.account?.address;
    if (!address) return Err('Wallet client does not have an account');

    if (matched)
      return (await super.getMatchedOrders(
        address,
        pending,
        paginationConfig,
      )) as Result<
        PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
        string
      >;

    return (await super.getUnMatchedOrders(
      address,
      paginationConfig,
    )) as Result<
      PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
      string
    >;
  }

  /**
   * Wrapper for the subscribeOrders method in the OrdersProvider class to abstract the address parameter.
   * @param matched - Whether to get matched or unmatched orders
   * @param interval - The interval to poll for updates
   * @param cb - The callback to be called when the orders are updated
   * @param paginationConfig - The configuration for the pagination
   * @returns {() => void} A function to unsubscribe from the order updates
   */
  async subscribeToOrders(
    interval: number,
    cb: (orders: PaginatedData<MatchedOrder>) => Promise<void>,
    paginationConfig?: PaginationConfig,
    pending?: boolean,
  ): Promise<() => void> {
    const address = this.walletClient.account?.address;
    if (!address) return () => {};

    return await super.subscribeOrders(
      address,
      true,
      interval,
      cb,
      pending,
      paginationConfig,
    );
  }

  async getUserOrdersCount(): AsyncResult<number, string> {
    const address = this.walletClient.account?.address;
    if (!address) return Err('Wallet client does not have an account');

    return super.getOrdersCount(address);
  }
}
