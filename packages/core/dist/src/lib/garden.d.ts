import { Orders, Order, Asset } from "@gardenfi/orderbook";
import type { IOrderbook } from "@gardenfi/orderbook";
import { ISwapper } from "./swapper";
import { IGardenJS, Wallets } from "./garden.types";
/**
 * @class
 * @implements {ICatalogJS}
 */
export declare class GardenJS implements IGardenJS {
    private readonly orderbook;
    private readonly wallets;
    /**
     * @constructor
     *
     * @param {IOrderbook} orderbook - The orderbook you want to connect to
     * @param {Partial<Wallets>} wallets - Each field in the wallet corresponds to the chain name and it's corresponding value is the wallet
     *
     */
    constructor(orderbook: IOrderbook, wallets: Partial<Wallets>);
    subscribeOrders(address: string, callback: (orders: Orders) => void): void;
    unsubscribeOrders(): void;
    swap(from: Asset, to: Asset, amt: number, receiveAmount: number, opts?: {
        btcInputAddress?: string;
    }): Promise<number>;
    getSwap(order: Order): ISwapper;
    calculateReceiveAmt(from: Asset, to: Asset, sendAmt: number): Promise<number>;
}
