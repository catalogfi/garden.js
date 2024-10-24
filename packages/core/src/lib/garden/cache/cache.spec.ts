import { describe, expect, it } from 'vitest';
import { ExecutorCache } from './executorCache';
import { MatchedOrder } from 'gardenfi/orderbook';
import { OrderActions } from '../garden.types';

describe('order Executor cache', () => {
  it('should set and get the same data', () => {
    const cache = new ExecutorCache();
    const order = {
      create_order: {
        create_id: '123',
      },
    } as MatchedOrder;

    cache.set(order, OrderActions.Redeem, 'txHash');
    const res = cache.get(order, OrderActions.Redeem);

    if (res) {
      console.log('found Cache');
    }

    expect(res?.txHash).toBe('txHash');
  });
});
