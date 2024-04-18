import { MarkNonNullable } from '@catalogfi/utils';
import { Asset } from './asset';
import { JsonRpcSigner, Wallet } from 'ethers';
import { IStore } from './store/store.interface';
/**
 * Type for the configuration of an Order.
 *
 * @typedef {Object} OrderConfig
 *
 * @template T extends boolean
 *
 * @property {T} verbose - Determines the verbosity of the order.
 * @property {boolean} taker - True if the order is a taker order, false otherwise.
 * @property {boolean} [pending] - True if the order is pending, false otherwise. Optional.
 *
 */
/**
 * Configuration for the orders you want to receive
 *
 * @typeParam T - Determines the verbosity of the order.
 */
export type OrderConfig<T extends boolean> = {
    /**
     * Determines the verbosity of the order.
     */
    verbose: T;
    /**
     * Set to true if the address should be a taker, else false if the address is the maker of the order.
     */
    taker: boolean;
    /**
     * Set to true if you want to receice pending orders
     */
    pending?: boolean;
};
/**
 * Configuration for creating an order
 *
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
     * The input amount the user wants to send in it's lowest denomincation
     */
    sendAmount: string;
    /**
     * The amount you receive amount
     */
    receiveAmount: string;
    /**
     * The hash of the secret, which is the double hash of the signature
     */
    secretHash: string;
    /**
     * The funds are received at this address if specified, otherwise the funds are sent to the receive address.
     */
    btcInputAddress: string;
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
 *
 */
export interface OrderbookConfig {
    /**
     *
     */
    url?: string;
    /**
     *
     */
    signer: JsonRpcSigner | Wallet;
    /**
     *
     */
    opts?: OrderbookOpts;
}
/**
 * @interface IOrderbook
 *
 */
export interface IOrderbook {
    /**
     * Creates an order
     * @param {CreateOrderConfig} orderConfig - The configuration for the creating the order.
     * @returns {number} The order ID.
     */
    createOrder(orderConfig: CreateOrderConfig): Promise<number>;
    /**
     * Get orders based on the provided address and order configuration.
     *
     * @template {boolean} T
     * @param {string} address - The address to get orders for.
     * @param {Partial<OrderConfig<T>>} orderConfig - (Optional) The configuration for the orders.
     * @returns {Promise<(T extends true ? Order : OrderNonVerbose)[]>} A promise that resolves to an array of orders.
     */
    getOrders<T extends boolean>(address: string, orderConfig?: Partial<OrderConfig<T>>): Promise<(T extends true ? Order : OrderNonVerbose)[]>;
    /**
     *
     *
     * @param {string} account - The account to subscribe to. Currently each orderbook instance can connect with a single account.
     * @param {(orders: Order[]) => void} cb - The callback to call when the orders are updated. The first response is all the orders created by this account.
     * @returns {void}
     */
    subscribeOrders(account: string, cb: (orders: Order[]) => void): void;
    /**
     * Unsubscribes from order updates.
     *
     * @returns {void}
     */
    unsubscribeOrders(): void;
}
export type AtomicSwap = {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string;
    swapStatus: number;
    secret: string;
    initiatorAddress: string;
    redeemerAddress: string;
    onChainIdentifier: string;
    timelock: string;
    chain: string;
    asset: string;
    currentConfirmation: number;
    minimumConfirmations: number;
    amount: string;
    filledAmount: string;
    priceByOracle: number;
    initiateTxHash: string;
    initiateBlockNumber: number;
    redeemTxHash: string;
    refundTxHash: string;
};
export type OrderNonVerbose = {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string;
    maker: string;
    taker: string;
    orderPair: string;
    InitiatorAtomicSwapID: number;
    FollowerAtomicSwapID: number;
    initiatorAtomicSwap: AtomicSwap | null;
    followerAtomicSwap: AtomicSwap | null;
    secretHash: string;
    secret: string;
    price: number;
    status: number;
    secretNonce: number;
    userBtcWalletAddress: string;
    RandomMultiplier: number;
    RandomScore: number;
    fee: number;
};
export type DecodedAuthToken = {
    userWallet: string;
    exp: number;
    iat: number;
};
export type Order = MarkNonNullable<OrderNonVerbose, 'initiatorAtomicSwap' | 'followerAtomicSwap'>;
export type Orders = Order[];
export type GetOrdersOutput<T extends boolean> = (T extends true ? Order : OrderNonVerbose)[];
export type CreateOrderResponse = {
    orderId: number;
};
