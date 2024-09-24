import { MatchedOrder } from './../orderbook/orderbook.types';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { OrdersProvider } from './ordersProvider';

describe('orders provider', async () => {
  const orderbookApi = 'http://localhost:4426';
  const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
  const id = 'ceda0b1a8ad05a8f58d0e013004d5e3d4f0f04b8c72f3a5c22471ea896892ff9';

  const ordersProvider = new OrdersProvider(orderbookApi);

  test('should get order', async () => {
    const order = await ordersProvider.getOrder(id, true);
    expect(order.error).toBeUndefined();
    expect(order.val.create_order.create_id).toEqual(id);
    expectTypeOf(order.val).toEqualTypeOf<MatchedOrder>();
  });

  test('should get orders of a address', async () => {
    const orders = await ordersProvider.getOrders(address, true);
    expect(orders.error).toBeUndefined();
    expect(orders.val.data.length).toBeGreaterThan(0);
    expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
  });

  test('should get all orders', async () => {
    const orders = await ordersProvider.getAllOrders(true);
    expect(orders.error).toBeUndefined();
    expect(orders.val.data.length).toBeGreaterThan(0);
    expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
  });

  test('should subscribe to orders', async () => {
    const unsubscribe = await ordersProvider.subscribeOrders(
      address,
      true,
      1000,
      (orders) => {
        expect(orders.data.length).toBeGreaterThan(0);
        expectTypeOf(orders.data).toEqualTypeOf<MatchedOrder[]>();
      },
    );
    expectTypeOf(unsubscribe).toEqualTypeOf<() => void>();
  });
});
