import { MatchedOrder } from '@gardenfi/orderbook';
import { IStore, MemoryStorage } from '@gardenfi/utils';
import {
  IOrderCache,
  OrderCacheAction,
  OrderCacheValue,
} from './orderExecutor.types';

export class OrderCache implements IOrderCache {
  private order: MatchedOrder;
  private store: IStore;

  constructor(order: MatchedOrder, store?: IStore) {
    this.order = order;
    this.store = store ?? new MemoryStorage();
  }

  getOrder(): MatchedOrder {
    return this.order;
  }

  set(action: OrderCacheAction, txHash: string): void {
    const value: OrderCacheValue = {
      txHash,
      timeStamp: Date.now(),
    };
    this.store.setItem(`${action}_${this.order.create_order.create_id}`, value);
    return;
  }

  get(action: OrderCacheAction): OrderCacheValue | null {
    const value = this.store.getItem(
      `${action}_${this.order.create_order.create_id}`,
    );
    if (!value) return null;

    const parsedValue = JSON.parse(value) as OrderCacheValue;
    if (!parsedValue.timeStamp || !parsedValue.txHash) return null;

    return parsedValue;
  }

  remove(action: OrderCacheAction): void {
    this.store.removeItem(`${action}_${this.order.create_order.create_id}`);
    return;
  }
}
