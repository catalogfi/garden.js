import { CreateOrderConfig, IOrderbook, Order, OrderConfig, OrderNonVerbose, OrderbookConfig } from './orderbook.types';
/**
 * A class that allows you to create and manage orders with the backend url.
 *
 * @class
 * @implements {IOrderbook}
 */
export declare class Orderbook implements IOrderbook {
    private orderSocket;
    private url;
    private auth;
    /**
     * Creates an instance of Orderbook. Does not login to the orderbook backend
     * @constructor
     * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
     *
     */
    constructor(orderbookConfig: OrderbookConfig);
    /**
     * Initializes the orderbook as well as logs in the orderbook and stores the auth token in the store.
     *
     * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
     */
    static init(orderbookConfig: OrderbookConfig): Promise<Orderbook>;
    createOrder(createOrderConfig: CreateOrderConfig): Promise<number>;
    getOrders<T extends boolean>(address: string, orderConfig?: Partial<OrderConfig<T>>): Promise<(T extends true ? Order : OrderNonVerbose)[]>;
    subscribeOrders(account: string, cb: (orders: Order[]) => void): void;
    unsubscribeOrders(): void;
    private validateConfig;
}
