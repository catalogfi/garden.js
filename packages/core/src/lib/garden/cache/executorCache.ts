import { Order } from '@gardenfi/orderbook';
import {
  IOrderExecutorCache,
  OrderActions,
  OrderCacheValue,
} from '../garden.types';

export class ExecutorCache implements IOrderExecutorCache {
  private cache: Record<string, OrderCacheValue> = {};

  set(order: Order, action: OrderActions, txHash: string, utxo?: string): void {
    const value: OrderCacheValue = {
      txHash,
      timeStamp: Date.now(),
      btcRedeemUTXO: utxo,
    };
    this.cache[`${action}_${order.created_at}`] = value;
    return;
  }

  get(order: Order, action: OrderActions): OrderCacheValue | null {
    return this.cache[`${action}_${order.created_at}`] || null;
  }

  remove(order: Order, action: OrderActions): void {
    delete this.cache[`${action}_${order.created_at}`];
    return;
  }
}

export class Cache<T> {
  private cache: Record<string, T> = {};

  set(key: string, value: T): void {
    this.cache[key] = value;
  }

  get(key: string): T | null {
    return this.cache[key] || null;
  }
}
