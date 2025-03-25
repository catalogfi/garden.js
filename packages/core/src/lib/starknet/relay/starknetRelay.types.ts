import { AsyncResult } from '@catalogfi/utils';
import { MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';

export type StarknetRelayOpts = {
  store?: IStore;
  domain?: string;
};

export interface IStarknetRelay {
  init(order: MatchedOrder): AsyncResult<string, string>;

  redeem(orderId: string, secret: string): AsyncResult<string, string>;
}
