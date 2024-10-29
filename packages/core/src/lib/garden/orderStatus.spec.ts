import { describe, expect, it } from 'vitest';
import { isExpired, ParseOrderStatus } from './orderStatusParser';
import { OrdersProvider } from '@gardenfi/orderbook';

describe('orderStatus', () => {
  it('test IsExpired', async () => {
    const res1 = isExpired(Date.now(), 1);
    const res2 = isExpired(1729608769, 1);
    expect(res1).toBe(false);
    expect(res2).toBe(true);
  });
  it('status', async () => {
    const ordersProvider = new OrdersProvider(
      'https://evm-swapper-relay.onrender.com/',
    );
    const order = await ordersProvider.getOrder(
      '7ded268bbb69ad73a3554a3b5b9b28c6774631ee2cc367bddeb5a19129975c07',
      true,
    );
    const status = ParseOrderStatus(order.val, 3195814, 6962989);
    console.log('status :', status);
  });
});
