import { Order } from './orderbook.types';

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
  UserCanInitiate = 'user can initiate',
  UserCanRedeem = 'user can redeem',
  UserCanRefund = 'user can refund',
  CounterpartyCanInitiate = 'counterparty can initiate',
  CounterpartyCanRedeem = 'counterparty can redeem',
  CounterpartyCanRefund = 'counterparty can refund',
  NoAction = 'no action can be performed',
}

export enum Status {
  OrderCreated = 'OrderCreated',
  OrderFilled = 'OrderFilled',
  PartiallyFilled = 'PartiallyFilled',
  InitiateDetected = 'InitiateDetected',
  Initiated = 'Initiated',
  OrderExpired = 'OrderExpired',
  RedeemDetected = 'RedeemDetected',
  RefundDetected = 'RefundDetected',
  Redeemed = 'Redeemed',
  Refunded = 'Refunded',
  OrderSoftFail = 'OrderSoftFail',
  OrderHardFail = 'OrderHardFail',
  OrderCancelled = 'OrderCancelled',
  OrderUnknownStatus = 'OrderUnknownStatus',
}

export const parseCurrentStatus = (
  order: Order
): {
  user: Status;
  counterparty: Status;
} => {
  const status =
    order.status * 100 +
    order.initiatorAtomicSwap.swapStatus * 10 +
    order.followerAtomicSwap.swapStatus;

  switch (true) {
    case status === 100:
      return {
        user: Status.OrderCreated,
        counterparty: Status.OrderCreated,
      };
    case status === 200:
      return {
        user: Status.OrderFilled,
        counterparty: Status.OrderFilled,
      };
    case status === 210:
      if (
        order.initiatorAtomicSwap.filledAmount <
        order.initiatorAtomicSwap.amount
      )
        return {
          user: Status.PartiallyFilled,
          counterparty: Status.PartiallyFilled,
        };
      else
        return {
          user: Status.InitiateDetected,
          counterparty: Status.OrderFilled,
        };
    case status === 220:
      return {
        user: Status.Initiated,
        counterparty: Status.OrderFilled,
      };
    case status === 221:
      if (
        order.followerAtomicSwap.filledAmount < order.followerAtomicSwap.amount
      )
        return {
          user: Status.Initiated,
          counterparty: Status.PartiallyFilled,
        };
      else
        return {
          user: Status.Initiated,
          counterparty: Status.InitiateDetected,
        };
    case status === 222:
      return {
        user: Status.Initiated, //212
        counterparty: Status.Initiated, //221
      };
    case /\d33/.test(`${status}`):
      return {
        user: Status.OrderExpired,
        counterparty: Status.OrderExpired,
      };
    case status === 232:
      return {
        user: Status.OrderExpired,
        counterparty: Status.Initiated,
      };
    case status === 223:
      return {
        user: Status.Initiated,
        counterparty: Status.OrderExpired,
      };
    case status === 224:
      return {
        user: Status.RedeemDetected, //222
        counterparty: Status.Initiated, //214
      };
    case status === 244:
      return {
        user: Status.RedeemDetected, //242
        counterparty: Status.RedeemDetected, //224
      };
    case status === 246:
      return {
        user: Status.Redeemed, //244
        counterparty: Status.RedeemDetected, //226
      };
    case status === 255:
      return {
        user: Status.RefundDetected,
        counterparty: Status.RefundDetected,
      };
    case /25\d/.test(`${status}`):
      switch (status % 10) {
        case 3:
          return {
            user: Status.RefundDetected,
            counterparty: Status.OrderExpired,
          };
        case 7:
          return {
            user: Status.RefundDetected,
            counterparty: Status.Refunded,
          };
        default:
          return {
            user: Status.RefundDetected,
            counterparty: Status.OrderUnknownStatus,
          };
      }
    case /2\d5/.test(`${status}`):
      switch (order.initiatorAtomicSwap.swapStatus) {
        case 3:
          return {
            user: Status.OrderExpired,
            counterparty: Status.RefundDetected,
          };
        case 7:
          return {
            user: Status.Refunded,
            counterparty: Status.RefundDetected,
          };
        default:
          return {
            user: Status.OrderUnknownStatus,
            counterparty: Status.RefundDetected,
          };
      }
    case status === 226:
      //   return Status.UserRedeemed;
      return {
        user: Status.Redeemed,
        counterparty: Status.Initiated,
      };
    case status === 266:
      return {
        user: Status.Redeemed, //264
        counterparty: Status.Redeemed, //246
      };
    case status === 277:
      return {
        user: Status.Refunded,
        counterparty: Status.Refunded,
      };
    case /27\d/.test(`${status}`):
      switch (status % 10) {
        case 3:
          return {
            user: Status.Refunded,
            counterparty: Status.OrderExpired,
          };
        default:
          return {
            user: Status.Refunded,
            counterparty: Status.OrderUnknownStatus,
          };
      }
    case /2\d7/.test(`${status}`):
      switch (order.initiatorAtomicSwap.swapStatus) {
        case 3:
          return {
            user: Status.OrderExpired,
            counterparty: Status.Refunded,
          };
        default:
          return {
            user: Status.OrderUnknownStatus,
            counterparty: Status.Refunded,
          };
      }
    case /4\d\d/.test(`${status}`):
      return {
        user: Status.OrderSoftFail,
        counterparty: Status.OrderSoftFail,
      };
    case /5\d\d/.test(`${status}`):
      return {
        user: Status.OrderHardFail,
        counterparty: Status.OrderHardFail,
      };
    case /6\d\d/.test(`${status}`):
      return {
        user: Status.OrderCancelled,
        counterparty: Status.OrderCancelled,
      };
    default:
      return {
        user: Status.OrderUnknownStatus,
        counterparty: Status.OrderUnknownStatus,
      };
  }
};
