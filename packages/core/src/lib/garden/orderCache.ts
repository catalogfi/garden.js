import { MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';
import { IOrderCache, OrderActions, OrderCacheValue } from './garden.types';

export class OrderCache implements IOrderCache {
  private order: MatchedOrder;
  private store: IStore;

  constructor(order: MatchedOrder, store: IStore) {
    this.order = order;
    this.store = store;
  }

  getOrder(): MatchedOrder {
    return this.order;
  }

  set(action: OrderActions, txHash: string): void {
    const value: OrderCacheValue = {
      txHash,
      timeStamp: Date.now(),
    };
    this.store.setItem(
      `${action}_${this.order.create_order.create_id}`,
      JSON.stringify(value),
    );
    return;
  }

  get(action: OrderActions): OrderCacheValue | null {
    const value = this.store.getItem(
      `${action}_${this.order.create_order.create_id}`,
    );
    if (!value) return null;

    const parsedValue = JSON.parse(value) as OrderCacheValue;
    if (!parsedValue.timeStamp || !parsedValue.txHash) return null;

    return parsedValue;
  }

  remove(action: OrderActions): void {
    this.store.removeItem(`${action}_${this.order.create_order.create_id}`);
    return;
  }
}
