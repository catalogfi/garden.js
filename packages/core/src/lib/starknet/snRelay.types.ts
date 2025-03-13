import { AsyncResult } from '@catalogfi/utils';
import { MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';
import { Account } from 'starknet';

export type StarknetRelayOpts = {
  store?: IStore;
  domain?: string;
};

export interface IStarknetRelay {
  init(account: Account, order: MatchedOrder): AsyncResult<string, string>;

  redeem(orderId: string, secret: string): AsyncResult<string, string>;
}
