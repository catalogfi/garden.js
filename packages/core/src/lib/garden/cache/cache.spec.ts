import { describe, expect, it } from 'vitest';
import { Cache } from './cache';
import { OrderActions } from '../garden.types';

describe('Cache', () => {
  it('should set and get the same data for OrderExecutorCache', () => {
    const cache = new Cache();
    const params = {
      type: 'OrderExecutorCache',
      action: OrderActions.Redeem,
      order: {
        create_order: {
          create_id: '123',
        },
      },
      txHash: 'txHash123',
      utxo: 'utxo123',
    };

    cache.set(params);
    const result = cache.get({
      type: 'OrderExecutorCache',
      action: OrderActions.Redeem,
      order: {
        create_order: {
          create_id: '123',
        },
      },
    });

    expect(result).toEqual({
      txHash: 'txHash123',
      timeStamp: expect.any(Number),
      btcRedeemUTXO: 'utxo123',
    });
  });

  it('should set and get the same data for RefundSacpCache', () => {
    const cache = new Cache();
    const params = {
      type: 'RefundSacpCache',
      orderId: 'order123',
      value: { refundAmount: 100 },
    };

    cache.set(params);
    const result = cache.get({
      type: 'RefundSacpCache',
      orderId: 'order123',
    });

    expect(result).toEqual({ refundAmount: 100 });
  });

  it('should set and get the same data for BitcoinRedeemCache', () => {
    const cache = new Cache();
    const params = {
      type: 'BitcoinRedeemCache',
      orderId: 'btcOrder123',
      value: { redeemAmount: 200 },
    };

    cache.set(params);
    const result = cache.get({
      type: 'BitcoinRedeemCache',
      orderId: 'btcOrder123',
    });

    expect(result).toEqual({ redeemAmount: 200 });
  });

  it('should remove data from the cache', () => {
    const cache = new Cache();
    const params = {
      type: 'RefundSacpCache',
      orderId: 'orderToRemove',
      value: { refundAmount: 50 },
    };

    cache.set(params);
    cache.remove({
      type: 'RefundSacpCache',
      orderId: 'orderToRemove',
    });
    const result = cache.get({
      type: 'RefundSacpCache',
      orderId: 'orderToRemove',
    });

    expect(result).toBeNull();
  });

  it('should throw an error for invalid cache type', () => {
    const cache = new Cache();

    expect(() => {
      cache.set({
        type: 'InvalidCacheType',
      } as any);
    }).toThrowError('Invalid cache type');
  });
});