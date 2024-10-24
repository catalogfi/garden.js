import { MatchedOrder } from '@gardenfi/orderbook';
import {
  IOrderExecutorCache,
  OrderActions,
  OrderCacheValue,
} from '../garden.types';

export class ExecutorCache implements IOrderExecutorCache {
  private cache: Record<string, OrderCacheValue> = {};

  set(
    order: MatchedOrder,
    action: OrderActions,
    txHash: string,
    utxo?: string,
  ): void {
    const value: OrderCacheValue = {
      txHash,
      timeStamp: Date.now(),
      btcRedeemUTXO: utxo,
    };
    this.cache[`${action}_${order.create_order.create_id}`] = value;
    return;
  }

  get(order: MatchedOrder, action: OrderActions): OrderCacheValue | null {
    return this.cache[`${action}_${order.create_order.create_id}`] || null;
  }

  remove(order: MatchedOrder, action: OrderActions): void {
    delete this.cache[`${action}_${order.create_order.create_id}`];
    return;
  }
}
