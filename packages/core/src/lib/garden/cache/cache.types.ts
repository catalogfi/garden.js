import { MatchedOrder } from "@gardenfi/orderbook";
import { OrderActions } from "../garden.types";

export type OrderExecutorCacheValue = {
  txHash: string;
  timeStamp: number;
  btcRedeemUTXO?: string;
};

export type RefundSacpCacheValue = {
  initTxHash: string;
};

export type BitcoinRedeemCacheValue = {
  redeemedFromUTXO: string;
  redeemedAt: number;
  redeemTxHash: string;
};

export type CacheValue =
  | OrderExecutorCacheValue
  | RefundSacpCacheValue
  | BitcoinRedeemCacheValue;

export type SetParams =
  | {
      type: 'OrderExecutorCache';
      order: MatchedOrder;
      action: OrderActions;
      txHash: string;
      utxo?: string;
    }
  | {
      type: 'RefundSacpCache';
      orderId: string;
      value: RefundSacpCacheValue;
    }
  | {
      type: 'BitcoinRedeemCache';
      orderId: string;
      value: BitcoinRedeemCacheValue;
    };

export type GetRemoveParams =
  | { type: 'OrderExecutorCache'; order: MatchedOrder; action: OrderActions }
  | { type: 'RefundSacpCache'; orderId: string }
  | { type: 'BitcoinRedeemCache'; orderId: string };