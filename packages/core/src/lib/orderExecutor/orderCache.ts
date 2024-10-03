import { MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';
import { IOrderCache, OrderCacheAction, OrderCacheValue } from './order.types';

export class OrderCache implements IOrderCache {
  private order: MatchedOrder;
  private store: IStore;
  private cacheExpirationDuration = 1000 * 60 * 5; // 5 minutes

  constructor(order: MatchedOrder, store: IStore) {
    this.order = order;
    this.store = store;
    this.deleteHistory();
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

    // const currentTimestamp = Date.now();
    // const timeDiff = currentTimestamp - parsedValue.timeStamp;
    // if (timeDiff > this.cacheExpirationDuration) {
    //   this.remove(action);
    //   return null;
    // }

    return parsedValue;
  }

  remove(action: OrderCacheAction): void {
    this.store.removeItem(`${action}_${this.order.create_order.create_id}`);
    return;
  }

  deleteHistory() {
    if (this.order.source_swap.initiate_tx_hash) {
      this.store.removeItem(`init_${this.order.create_order.create_id}`);
    }
    if (this.order.destination_swap.redeem_tx_hash) {
      this.store.removeItem(`redeem_${this.order.create_order.create_id}`);
    }
    if (this.order.source_swap.refund_tx_hash) {
      this.store.removeItem(`refund_${this.order.create_order.create_id}`);
    }
  }
}
