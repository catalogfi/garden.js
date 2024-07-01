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
  OrderCreated,
  OrderFilled,
  UserPartiallyFilled,
  UserInitiateDetected,
  UserInitiated,
  CounterpartyPartiallyFilled,
  CounterpartyInitiateDetected,
  CounterpartyInitiated,
  UserOrderExpired,
  CounterpartyOrderExpired,
  UserRedeemDetected,
  CounterpartyRedeemDetected,
  UserRefundDetected,
  CounterpartyRefundDetected,
  UserRedeemed,
  CounterpartyRedeemed,
  UserRefunded,
  CounterpartyRefunded,
  OrderSoftFail,
  OrderHardFail,
  OrderCancelled,
  OrderUnknownStatus,
}

export const parseCurrentStatus = (
  order: Order,
  isFollower: boolean = false
) => {
  const status =
    order.status * 100 +
    order.initiatorAtomicSwap.swapStatus * 10 +
    order.followerAtomicSwap.swapStatus;

  switch (true) {
    case status === 100:
      return Status.OrderCreated;
    case status === 200:
      return Status.OrderFilled;
    case status === 210:
      if (
        order.initiatorAtomicSwap.filledAmount <
        order.initiatorAtomicSwap.amount
      )
        return Status.UserPartiallyFilled;
      else return Status.UserInitiateDetected;
    case status === 220:
      return Status.UserInitiated;
    case status === 221:
      if (
        order.followerAtomicSwap.filledAmount < order.followerAtomicSwap.amount
      )
        return Status.CounterpartyPartiallyFilled;
      else return Status.CounterpartyInitiateDetected;
    case status === 222:
      return Status.CounterpartyInitiated;
    case /\d33/.test(`${status}`):
      if (!isFollower) return Status.UserOrderExpired;
      else return Status.CounterpartyOrderExpired;
    case /\d3\d/.test(`${status}`):
      return Status.UserOrderExpired;
    case /\d\d3/.test(`${status}`):
      return Status.CounterpartyOrderExpired;
    case status === 224:
      if (!isFollower) return Status.UserRedeemDetected; //222
      else return Status.CounterpartyInitiated; //214
    case status === 244:
      if (!isFollower) return Status.UserRedeemDetected; //242
      else return Status.CounterpartyRedeemDetected; // 224
    case status === 226:
      return Status.UserRedeemed;
    case status === 246:
      if (!isFollower) return Status.UserRedeemed; //244
      else return Status.CounterpartyRedeemDetected; //226
    case status === 255:
      if (!isFollower) return Status.UserRefundDetected; //253
      else return Status.CounterpartyRefundDetected; // 235
    case /25\d/.test(`${status}`):
      return Status.UserRefundDetected;
    case /2\d5/.test(`${status}`):
      return Status.CounterpartyRefundDetected;
    case status === 226:
      return Status.UserRedeemed;
    case status === 266:
      if (!isFollower) return Status.UserRedeemed; //264
      else return Status.CounterpartyRedeemed; //246
    case status === 277:
      if (!isFollower) return Status.UserRefunded; //275
      else return Status.CounterpartyRefunded; //257
    case /27\d/.test(`${status}`):
      return Status.UserRefunded;
    case /2\d7/.test(`${status}`):
      return Status.CounterpartyRefunded;
    case /4\d\d/.test(`${status}`):
      return Status.OrderSoftFail;
    case /5\d\d/.test(`${status}`):
      return Status.OrderHardFail;
    case /6\d\d/.test(`${status}`):
      return Status.OrderCancelled;
    default:
      return Status.OrderUnknownStatus;
  }

  //   if (status === 100) return Status.OrderCreated;
  //   else if (status === 200) return Status.OrderFilled;
  //   else if (status === 210) {
  //     if (
  //       order.initiatorAtomicSwap.filledAmount < order.initiatorAtomicSwap.amount
  //     )
  //       return Status.UserPartiallyFilled;
  //     else return Status.UserInitiateDetected;
  //   } else if (status === 220) return Status.UserInitiated;
  //   else if (status === 221) {
  //     if (order.followerAtomicSwap.filledAmount < order.followerAtomicSwap.amount)
  //       return Status.CounterpartyPartiallyFilled;
  //     else return Status.CounterpartyInitiateDetected;
  //   } else if (status === 222) return Status.CounterpartyInitiated;
  //   else if (/\d33/.test(`${status}`)) {
  //     if (!isFollower) return Status.UserOrderExpired;
  //     else return Status.CounterpartyOrderExpired;
  //   } else if (/\d3\d/.test(`${status}`)) return Status.UserOrderExpired;
  //   else if (/\d\d3/.test(`${status}`)) return Status.CounterpartyOrderExpired;
  //   else if (status === 224) {
  //     if (!isFollower) return Status.UserRedeemDetected; //222
  //     else return Status.CounterpartyInitiated; //214
  //   }
  //   if (status === 244) {
  //     if (!isFollower) return Status.UserRedeemDetected; //242
  //     else return Status.CounterpartyRedeemDetected; // 224
  //   } else if (status === 246) {
  //     if (!isFollower) return Status.UserRedeemed; //244
  //     else return Status.CounterpartyRedeemDetected; //226
  //   } else if (status === 255) {
  //     if (!isFollower) return Status.UserRefundDetected; //253
  //     else return Status.CounterpartyRefundDetected; // 235
  //   } else if (/25\d/.test(`${status}`)) return Status.UserRefundDetected;
  //   else if (/2\d5/.test(`${statuxs}`)) return Status.CounterpartyRefundDetected;
  //   else if (status === 226) return Status.UserRedeemed;
  //   else if (status === 266) {
  //     if (!isFollower) return Status.UserRedeemed; //264
  //     else return Status.CounterpartyRedeemed; //246
  //   } else if (status === 277) {
  //     if (!isFollower) return Status.UserRefunded; //275
  //     else return Status.CounterpartyRefunded; //257
  //   } else if (/27\d/.test(`${status}`)) return Status.UserRefunded;
  //   else if (/2\d7/.test(`${status}`)) return Status.CounterpartyRefunded;
  //   else if (/4\d\d/.test(`${status}`)) return Status.OrderSoftFail;
  //   else if (/5\d\d/.test(`${status}`)) return Status.OrderHardFail;
  //   else if (/6\d\d/.test(`${status}`)) return Status.OrderCancelled;
  //   else return Status.OrderUnknownStatus;
};

// parseCurrentStatus({
//   status: 4,
//   initiatorAtomicSwap: {
//     filledAmount: 0,
//     amount: 0,
//     swapStatus: 0,
//   },
//   followerAtomicSwap: {
//     filledAmount: 0,
//     amount: 0,
//     swapStatus: 0,
//   },
// });
