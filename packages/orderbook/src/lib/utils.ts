import { Order } from "./orderbook.types";

export const parseStatus = (order: Order) => {
    const status =
        order.status * 100 +
        order.initiatorAtomicSwap.swapStatus * 10 +
        order.followerAtomicSwap.swapStatus;

    if (status === 200) return Actions.UserCanInitiate;
    else if (status === 222) return Actions.UserCanRedeem;
    else if (/\d3\d/.test(`${status}`)) return Actions.UserCanRefund;
    else if (status === 220) return Actions.CounterpartyCanInitiate;
    else if (status === 224 || status === 226)
        return Actions.CounterpartyCanRedeem;
    else if (/\d\d3/.test(`${status}`)) return Actions.CounterpartyCanRefund;
    else return Actions.NoAction;
};

export enum Actions {
    UserCanInitiate = "user can initiate",
    UserCanRedeem = "user can redeem",
    UserCanRefund = "user can refund",
    CounterpartyCanInitiate = "counterparty can initiate",
    CounterpartyCanRedeem = "counterparty can redeem",
    CounterpartyCanRefund = "counterparty can refund",
    NoAction = "no action can be performed",
}
