import { LRUCache } from 'lru-cache';
import { MatchedOrder } from '@gardenfi/orderbook';

export enum CacheType {
  OrderExecutor = 'orderExecutor',
  BitcoinRedeem = 'bitcoinRedeem',
  RefundSacp = 'refundSacp',
}

interface BitcoinRedeemData {
  redeemedFromUTXO: string;
  redeemedAt: number;
  redeemTxHash: string;
}

interface CacheOptions {
  max?: number;
  ttl?: number;
}

export class GardenCache {
  private caches: Map<CacheType, LRUCache<string, any>>;

  constructor(options: CacheOptions = {}) {
    const defaultOptions = {
      max: 500,
      ttl: 1000 * 60 * 60,
      allowStale: false,
      updateAgeOnGet: true,
      ...options,
    };

    this.caches = new Map();
    Object.values(CacheType).forEach((type) => {
      this.caches.set(type, new LRUCache(defaultOptions));
    });
  }

  private getCache(type: CacheType): LRUCache<string, any> {
    const cache = this.caches.get(type);
    if (!cache) {
      throw new Error(`Cache type ${type} not found`);
    }
    return cache;
  }

  set(type: CacheType, key: string, value: any, ttl?: number): void {
    const cache = this.getCache(type);
    const options = ttl ? { ttl } : undefined;
    cache.set(key, value, options);
  }

  get(type: CacheType, key: string): any {
    const cache = this.getCache(type);
    return cache.get(key);
  }

  remove(type: CacheType, key: string): void {
    const cache = this.getCache(type);
    cache.delete(key);
  }

  clear(type?: CacheType): void {
    if (type) {
      const cache = this.getCache(type);
      cache.clear();
    } else {
      this.caches.forEach((cache) => cache.clear());
    }
  }

  // Specialized methods for Bitcoin redeem cache
  setBitcoinRedeem(
    orderId: string,
    data: BitcoinRedeemData,
    ttl?: number,
  ): void {
    this.set(CacheType.BitcoinRedeem, orderId, data, ttl);
  }

  getBitcoinRedeem(orderId: string): BitcoinRedeemData | undefined {
    return this.get(CacheType.BitcoinRedeem, orderId);
  }

  // orderExecutorCache methods
  setOrderExecution(
    order: MatchedOrder,
    action: string,
    value: any,
    ttl?: number,
  ): void {
    const key = `${order.create_order.create_id}:${action}`;
    this.set(CacheType.OrderExecutor, key, value, ttl);
  }

  getOrderExecution(order: MatchedOrder, action: string): any {
    const key = `${order.create_order.create_id}:${action}`;
    return this.get(CacheType.OrderExecutor, key);
  }

  // refundSacp cache methods
  setSacpCache(orderId: string, data: any, ttl?: number): void {
    this.set(CacheType.RefundSacp, orderId, data, ttl);
  }

  getSacpCache(orderId: string): any {
    return this.get(CacheType.RefundSacp, orderId);
  }

  // Additional utility methods
  has(type: CacheType, key: string): boolean {
    const cache = this.getCache(type);
    return cache.has(key);
  }

  peek(type: CacheType, key: string): any {
    const cache = this.getCache(type);
    return cache.peek(key);
  }

  getRemainingTTL(type: CacheType, key: string): number {
    const cache = this.getCache(type);
    return cache.getRemainingTTL(key);
  }
}
