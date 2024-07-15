import { AtomicSwap, Order } from './orderbook.types';
import { Status, parseCurrentStatus } from './status';

import { describe, test, expect } from 'vitest';

const fixtures: [number, Status, Status][] = [
  [100, Status.OrderCreated, Status.OrderCreated],
  [200, Status.OrderFilled, Status.OrderFilled],
  [210, Status.InitiateDetected, Status.OrderFilled],
  [220, Status.Initiated, Status.OrderFilled],
  [221, Status.Initiated, Status.InitiateDetected],
  [222, Status.Initiated, Status.Initiated],
  [223, Status.Initiated, Status.OrderExpired],
  [224, Status.RedeemDetected, Status.Initiated],
  [244, Status.RedeemDetected, Status.RedeemDetected],
  [246, Status.Redeemed, Status.RedeemDetected],
  [255, Status.RefundDetected, Status.RefundDetected],
  [253, Status.RefundDetected, Status.OrderExpired],
  [257, Status.RefundDetected, Status.Refunded],
  [226, Status.Redeemed, Status.Initiated],
  [266, Status.Redeemed, Status.Redeemed],
  [277, Status.Refunded, Status.Refunded],
  [477, Status.OrderSoftFail, Status.OrderSoftFail],
  [576, Status.OrderHardFail, Status.OrderHardFail],
  [600, Status.OrderCancelled, Status.OrderCancelled],
];

describe('status', () => {
  fixtures.forEach((f) => {
    test(`should parse status ${f[0]} as \nuser: ${f[1]}\ncounterparty: ${f[2]}`, () => {
      expect(parseCurrentStatus(createOrder(f[0]))).toEqual({
        user: f[1],
        counterparty: f[2],
      });
    });
  });
});

const createOrder = (status: number): Order => {
  const followerAtomicSwapStatus = status % 10;
  const initiatorAtomicSwapStatus = Math.floor(status / 10) % 10;
  const orderStatus = Math.floor(status / 100) % 10;

  return {
    status: orderStatus,
    followerAtomicSwap: {
      swapStatus: followerAtomicSwapStatus,
      filledAmount: 0,
      amount: 0,
    } as unknown as AtomicSwap,
    initiatorAtomicSwap: {
      swapStatus: initiatorAtomicSwapStatus,
    } as unknown as AtomicSwap,
  } as Order;
};
