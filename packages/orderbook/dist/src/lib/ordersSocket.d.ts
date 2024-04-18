import { Orders } from "./orderbook.types";
export declare class OrdersSocket {
    private url;
    private socket;
    constructor(url: string);
    subscribe(account: string, cb: (orders: Orders) => void): void;
    unsubscribe: () => void | undefined;
}
