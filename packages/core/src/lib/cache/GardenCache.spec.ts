import { describe, expect, it, beforeEach } from 'vitest';
import { GardenCache, CacheType } from './GardenCache';
import { MatchedOrder } from '@gardenfi/orderbook';

describe('GardenCache', () => {
  let cache: GardenCache;

  beforeEach(() => {
    cache = new GardenCache();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get values correctly', () => {
      cache.set(CacheType.OrderExecutor, 'test-key', 'test-value');
      expect(cache.get(CacheType.OrderExecutor, 'test-key')).toBe('test-value');
    });

    it('should handle TTL correctly', async () => {
      cache.set(CacheType.OrderExecutor, 'ttl-key', 'ttl-value', 100); // 100ms TTL
      expect(cache.get(CacheType.OrderExecutor, 'ttl-key')).toBe('ttl-value');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get(CacheType.OrderExecutor, 'ttl-key')).toBeUndefined();
    });

    it('should remove values correctly', () => {
      cache.set(CacheType.OrderExecutor, 'remove-key', 'remove-value');
      cache.remove(CacheType.OrderExecutor, 'remove-key');
      expect(cache.get(CacheType.OrderExecutor, 'remove-key')).toBeUndefined();
    });

    it('should clear specific cache type', () => {
      cache.set(CacheType.OrderExecutor, 'key1', 'value1');
      cache.set(CacheType.BitcoinRedeem, 'key2', 'value2');

      cache.clear(CacheType.OrderExecutor);

      expect(cache.get(CacheType.OrderExecutor, 'key1')).toBeUndefined();
      expect(cache.get(CacheType.BitcoinRedeem, 'key2')).toBe('value2');
    });

    it('should clear all caches', () => {
      cache.set(CacheType.OrderExecutor, 'key1', 'value1');
      cache.set(CacheType.BitcoinRedeem, 'key2', 'value2');

      cache.clear();

      expect(cache.get(CacheType.OrderExecutor, 'key1')).toBeUndefined();
      expect(cache.get(CacheType.BitcoinRedeem, 'key2')).toBeUndefined();
    });
  });

  describe('Bitcoin Redeem Cache', () => {
    const bitcoinRedeemData = {
      redeemedFromUTXO: 'utxo123',
      redeemedAt: Date.now(),
      redeemTxHash: 'hash123',
    };

    it('should set and get bitcoin redeem data', () => {
      cache.setBitcoinRedeem('order123', bitcoinRedeemData);
      const retrieved = cache.getBitcoinRedeem('order123');
      expect(retrieved).toEqual(bitcoinRedeemData);
    });

    it('should handle TTL for bitcoin redeem data', async () => {
      cache.setBitcoinRedeem('order123', bitcoinRedeemData, 100);
      expect(cache.getBitcoinRedeem('order123')).toEqual(bitcoinRedeemData);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.getBitcoinRedeem('order123')).toBeUndefined();
    });
  });

  describe('Order Execution Cache', () => {
    const mockOrder = {
      create_order: {
        create_id: 'order123',
      },
    } as MatchedOrder;

    it('should set and get order execution data', () => {
      cache.setOrderExecution(mockOrder, 'action1', 'value1');
      expect(cache.getOrderExecution(mockOrder, 'action1')).toBe('value1');
    });

    it('should handle TTL for order execution data', async () => {
      cache.setOrderExecution(mockOrder, 'action1', 'value1', 100);
      expect(cache.getOrderExecution(mockOrder, 'action1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.getOrderExecution(mockOrder, 'action1')).toBeUndefined();
    });
  });

  describe('SACP Cache', () => {
    it('should set and get SACP data', () => {
      const sacpData = { initTxHash: 'hash123' };
      cache.setSacpCache('order123', sacpData);
      expect(cache.getSacpCache('order123')).toEqual(sacpData);
    });

    it('should handle TTL for SACP data', async () => {
      const sacpData = { initTxHash: 'hash123' };
      cache.setSacpCache('order123', sacpData, 100);
      expect(cache.getSacpCache('order123')).toEqual(sacpData);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.getSacpCache('order123')).toBeUndefined();
    });
  });

  describe('Utility Methods', () => {
    it('should check if key exists', () => {
      cache.set(CacheType.OrderExecutor, 'key1', 'value1');
      expect(cache.has(CacheType.OrderExecutor, 'key1')).toBe(true);
      expect(cache.has(CacheType.OrderExecutor, 'nonexistent')).toBe(false);
    });

    it('should peek values without affecting TTL', () => {
      cache.set(CacheType.OrderExecutor, 'key1', 'value1');
      expect(cache.peek(CacheType.OrderExecutor, 'key1')).toBe('value1');
    });

    it('should get remaining TTL', () => {
      cache.set(CacheType.OrderExecutor, 'key1', 'value1', 1000);
      const ttl = cache.getRemainingTTL(CacheType.OrderExecutor, 'key1');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1000);
    });

    it('should throw error for invalid cache type', () => {
      expect(() => {
        cache.get('invalid-type' as CacheType, 'key1');
      }).toThrow('Cache type invalid-type not found');
    });
  });

  describe('Cache Options', () => {
    it('should respect custom max size', () => {
      const smallCache = new GardenCache({ max: 2 });
      smallCache.set(CacheType.OrderExecutor, 'key1', 'value1');
      smallCache.set(CacheType.OrderExecutor, 'key2', 'value2');
      smallCache.set(CacheType.OrderExecutor, 'key3', 'value3');

      expect(smallCache.get(CacheType.OrderExecutor, 'key1')).toBeUndefined();
      expect(smallCache.get(CacheType.OrderExecutor, 'key3')).toBe('value3');
    });

    it('should respect custom TTL', async () => {
      const quickCache = new GardenCache({ ttl: 100 });
      quickCache.set(CacheType.OrderExecutor, 'key1', 'value1');

      expect(quickCache.get(CacheType.OrderExecutor, 'key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(quickCache.get(CacheType.OrderExecutor, 'key1')).toBeUndefined();
    });
  });
});
