import { MatchedOrder } from './../orderbook/orderbook.types';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { OrdersProvider } from './ordersProvider';
import { API } from '@gardenfi/utils';

describe('orders provider', async () => {
  const orderbookApi = API.localnet.orderbook;
  const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
  const id = '25fed136323d6c428ff5b0281a7da117cff222325853ae3cd77161718e266103';

  const ordersProvider = new OrdersProvider(orderbookApi);

  test('should get order', async () => {
    const order = await ordersProvider.getOrder(id, true);
    console.log('order.error :', order.error);
    console.log('order.val :', order.val);
    expect(order.error).toBeUndefined();
    expect(order.val.create_order.create_id).toEqual(id);
    expectTypeOf(order.val).toEqualTypeOf<MatchedOrder>();
  });

  test('should get orders of a address', async () => {
    const orders = await ordersProvider.getMatchedOrders(address, false);
    expect(orders.error).toBeUndefined();
    expect(orders.val.data.length).toBeGreaterThan(0);
    expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
  });

  test('should get all orders', async () => {
    const orders = await ordersProvider.getOrders(true);
    expect(orders.error).toBeUndefined();
    expect(orders.val.data.length).toBeGreaterThan(0);
    expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
  });

  test('should subscribe to orders', async () => {
    const unsubscribe = await ordersProvider.subscribeOrders(
      address,
      true,
      1000,
      async (orders) => {
        expect(orders.data.length).toBeGreaterThan(0);
        expectTypeOf(orders.data).toEqualTypeOf<MatchedOrder[]>();
      },
    );
    expectTypeOf(unsubscribe).toEqualTypeOf<() => void>();
  });

  test('order count', async () => {
    const count = await ordersProvider.getOrdersCount(address);
    expect(count.error).toBeUndefined();
    expect(count.val).toBeGreaterThanOrEqual(15);
  });
});
