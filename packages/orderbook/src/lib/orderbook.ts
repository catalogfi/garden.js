import { Fetcher, trim0x } from '@catalogfi/utils';
import {
  CreateOrderConfig,
  CreateOrderResponse,
  GetOrdersOutput,
  IOrderbook,
  Order,
  OrderConfig,
  OrderNonVerbose,
  OrderbookConfig,
} from './orderbook.types';
import { OrdersSocket } from './ordersSocket';
import { Siwe } from './auth/siwe';
import { IAuth } from './auth/auth.interface';
import { orderPairGenerator } from './orderpair';
import { OrderbookErrors } from './errors';
import { StoreKeys } from './store/store.interface';
import { MemoryStorage } from './store/memoryStorage';
import { API } from './api';
import { Url } from './url';
import { Chain, SupportedContracts } from './asset';

/**
 * A class that allows you to create and manage orders with the backend url.
 *
 * @class
 * @implements {IOrderbook}
 */
export class Orderbook implements IOrderbook {
  private orderSocket: OrdersSocket;
  private url: Url;
  private auth: IAuth;
  private supportedContracts: SupportedContracts = {};

  /**
   * Creates an instance of Orderbook. Does not login to the orderbook backend
   * @constructor
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   *
   */
  constructor(orderbookConfig: OrderbookConfig) {
    this.url = new Url('/', orderbookConfig.url ?? API);
    this.orderSocket = new OrdersSocket(this.url.socket());

    this.auth = new Siwe(this.url, orderbookConfig.signer, {
      ...orderbookConfig.opts,
      store: orderbookConfig.opts?.store || new MemoryStorage(),
    });
  }

  /**
   * Initializes the orderbook as well as logs in the orderbook and stores the auth token in the store.
   *
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   */

  static async init(orderbookConfig: OrderbookConfig) {
    const auth = new Siwe(
      new Url('/', orderbookConfig.url ?? API),
      orderbookConfig.signer,
      orderbookConfig.opts
    );
    const authToken = await auth.getToken();
    const store = orderbookConfig.opts?.store ?? new MemoryStorage();
    orderbookConfig.opts = {
      ...orderbookConfig.opts,
      store,
    };
    store.setItem(StoreKeys.AUTH_TOKEN, authToken);
    return new Orderbook(orderbookConfig);
  }
  /**
   * Returns the supported contracts from the orderbook.
   */
  async getSupportedContracts(): Promise<SupportedContracts> {
    if (Object.keys(this.supportedContracts).length > 0)
      return this.supportedContracts;

    const url = this.url.endpoint('assets');

    const assetsFromOrderbook = await Fetcher.get<
      Partial<Record<Chain, string[]>>
    >(url);

    const assets: SupportedContracts = {};

    for (const chain in assetsFromOrderbook) {
      assets[chain as Chain] = assetsFromOrderbook[chain as Chain]![0];
    }
    this.supportedContracts = assets;
    return assets;
  }

  async getOrder(orderId: number): Promise<Order> {
    const url = this.url.endpoint(`orders/${orderId}`);
    return Fetcher.get<Order>(url);
  }

  async createOrder(createOrderConfig: CreateOrderConfig): Promise<number> {
    const {
      sendAmount,
      secretHash,
      receiveAmount,
      fromAsset,
      toAsset,
      ...rest
    } = createOrderConfig;
    this.validateConfig(createOrderConfig);
    const contracts = await this.getSupportedContracts();
    const orderPair = orderPairGenerator(fromAsset, toAsset, contracts);

    const url = this.url.endpoint('orders');
    const { orderId } = await Fetcher.post<CreateOrderResponse>(url, {
      body: JSON.stringify({
        ...rest,
        sendAmount,
        receiveAmount,
        secretHash: trim0x(secretHash),
        orderPair,
        userWalletBTCAddress: rest.btcInputAddress,
      }),
      headers: {
        Authorization: await this.auth.getToken(),
      },
    });

    return orderId;
  }

  async getOrders<T extends boolean>(
    address: string,
    orderConfig?: Partial<OrderConfig<T>>
  ): Promise<(T extends true ? Order : OrderNonVerbose)[]> {
    const ordersResponse = await Fetcher.get<GetOrdersOutput<T>>(
      this.url +
        'orders?' +
        new URLSearchParams({
          ...(orderConfig?.taker ? { taker: address } : { maker: address }),
          verbose: orderConfig?.verbose ? 'true' : 'false',
          ...(orderConfig?.pending ? { status: '2' } : {}),
        })
    );

    if (orderConfig?.verbose) {
      return ordersResponse as GetOrdersOutput<true>;
    }

    return ordersResponse;
  }

  subscribeOrders(account: string, cb: (orders: Order[]) => void): void {
    this.orderSocket.subscribe(account, cb);
  }

  unsubscribeOrders(): void {
    this.orderSocket.unsubscribe();
  }

  private validateConfig(config: CreateOrderConfig) {
    const { sendAmount, receiveAmount } = config;
    const inputAmount = +sendAmount;
    const outputAmount = +receiveAmount;
    if (isNaN(inputAmount) || inputAmount <= 0 || sendAmount.includes('.'))
      throw new Error(OrderbookErrors.INVALID_SEND_AMOUNT);

    if (isNaN(outputAmount) || outputAmount <= 0 || receiveAmount.includes('.'))
      throw new Error(OrderbookErrors.INVALID_RECEIVE_AMOUNT);
  }
}
