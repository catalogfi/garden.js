import { Actions, Order } from "@gardenfi/orderbook";
import { Chain } from "@gardenfi/orderbook";
import { IBaseWallet } from "@catalogfi/wallets";
export interface ISwapper {
    id(): string;
    next(): Promise<SwapOutput>;
}
export declare class Swapper implements ISwapper {
    private order;
    private wallets;
    constructor(order: Order, wallet: Partial<Record<Chain, IBaseWallet>>);
    get action(): Actions;
    get status(): number;
    next(): Promise<SwapOutput>;
    private init;
    private redeem;
    private refund;
    id(): string;
    private getWallet;
}
export declare enum SwapperRole {
    INITIATOR = "initiator",
    REDEEMER = "redeemer"
}
export declare enum SwapperActions {
    Init = "Initiate",
    Redeem = "Redeem",
    Refund = "Refund",
    None = "None"
}
export type SwapOutput = {
    user: SwapperRole;
    action: SwapperActions;
    output: string;
};
