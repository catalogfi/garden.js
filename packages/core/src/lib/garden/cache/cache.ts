import NodeCache from 'node-cache';
import { SetParams, GetRemoveParams, CacheValue } from './cache.types';

export class Cache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 24 * 60 * 60, checkperiod: 10 * 60 }); // Default TTL: 24 hours
  }

  /**
   * Set a value in the cache.
   * @param params - Parameters specific to the cache type.
   */
  set(params: SetParams): void {
    let key: string;
    let value: CacheValue;

    switch (params.type) {
      case 'OrderExecutorCache':
        key = `OrderExecutor_${params.action}_${params.order.create_order.create_id}`;
        value = {
          txHash: params.txHash,
          timeStamp: Date.now(),
          btcRedeemUTXO: params.utxo,
        };
        break;

      case 'RefundSacpCache':
        key = `RefundSacp_${params.orderId}`;
        value = params.value;
        break;

      case 'BitcoinRedeemCache':
        key = `BitcoinRedeem_${params.orderId}`;
        value = params.value;
        break;

      default:
        throw new Error('Invalid cache type');
    }

    this.cache.set(key, value);
  }

  /**
   * Get a value from the cache.
   * @param params - Parameters specific to the cache type.
   * @returns The cached value, or `null` if the key does not exist.
   */
  get(params: GetRemoveParams): CacheValue | null {
    let key: string;

    switch (params.type) {
      case 'OrderExecutorCache':
        key = `OrderExecutor_${params.action}_${params.order.create_order.create_id}`;
        break;

      case 'RefundSacpCache':
        key = `RefundSacp_${params.orderId}`;
        break;

      case 'BitcoinRedeemCache':
        key = `BitcoinRedeem_${params.orderId}`;
        break;

      default:
        throw new Error('Invalid cache type');
    }

    return this.cache.get<CacheValue>(key) || null;
  }

  /**
   * Remove a value from the cache.
   * @param params - Parameters specific to the cache type.
   */
  remove(params: GetRemoveParams): void {
    let key: string;

    switch (params.type) {
      case 'OrderExecutorCache':
        key = `OrderExecutor_${params.action}_${params.order.create_order.create_id}`;
        break;

      case 'RefundSacpCache':
        key = `RefundSacp_${params.orderId}`;
        break;

      case 'BitcoinRedeemCache':
        key = `BitcoinRedeem_${params.orderId}`;
        break;

      default:
        throw new Error('Invalid cache type');
    }

    this.cache.del(key);
  }
}