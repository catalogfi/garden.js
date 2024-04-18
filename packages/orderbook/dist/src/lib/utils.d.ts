import { Order } from './orderbook.types';
export declare const parseStatus: (order: Order) => Actions;
export declare const parseURL: (url: string) => string;
export declare enum Actions {
    UserCanInitiate = "user can initiate",
    UserCanRedeem = "user can redeem",
    UserCanRefund = "user can refund",
    CounterpartyCanInitiate = "counterparty can initiate",
    CounterpartyCanRedeem = "counterparty can redeem",
    CounterpartyCanRefund = "counterparty can refund",
    NoAction = "no action can be performed"
}
