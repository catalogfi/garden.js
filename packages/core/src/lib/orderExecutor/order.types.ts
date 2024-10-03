import { AsyncResult } from '@catalogfi/utils';
import { IBitcoinWallet } from '@catalogfi/wallets';
import { WalletClient } from 'viem';
import { ISecretManager } from '../secretManager/secretManager.types';
import { MatchedOrder } from '@gardenfi/orderbook';

/**
 * Order statuses
 */
export enum OrderStatus {
  /**
   * - Order is created
   * - Waiting for match
   */
  Created = 'Created',
  /**
   * - Order is matched
   * - User has to initiate
   */
  Matched = 'Matched',
  /**
   * - User initiate tx detected on-chain but not confirmed
   */
  InitiateDetected = 'InitiateDetected',
  /**
   * - User initiated
   * - Waiting for counter party to initiate
   */
  Initiated = 'Initiated',
  /**
   * - Counter party initiate tx detected on-chain but not confirmed
   */
  CounterPartyInitiateDetected = 'CounterPartyInitiateDetected',
  /**
   * - Counter party initiated
   * - User has to redeem
   */
  CounterPartyInitiated = 'CounterPartyInitiated',
  /**
   * - User redeem tx detected on-chain but not confirmed
   */
  RedeemDetected = 'RedeemDetected',
  /**
   * - User redeemed
   * - Counter party has to redeem
   * - We also consider user redemption as completed order.
   */
  Redeemed = 'Redeemed',
  /**
   * - Counter party redeem tx detected on-chain but not confirmed
   */
  CounterPartyRedeemDetected = 'CounterPartyRedeemDetected',
  /**
   * - Counter party redeemed
   * - Order is completed
   */
  CounterPartyRedeemed = 'CounterPartyRedeemed',
  /**
   * - Counter party redeemed
   * - Order is completed
   */
  Completed = 'Completed',
  /**
   * - The counterparty's swap has expired, and they will refund their funds.
   * - The user can no longer redeem the funds. The user must wait for their swap to expire and then refund their funds.
   * - Typically, in our system, the counterparty's swap expires in 24 hours, and the user's swap expires in 48 hours.
   */
  CounterPartySwapExpired = 'CounterPartySwapExpired',
  /**
   * - The user's swap has expired, and they have to refund their funds.
   * - The user's expiry only happens after counterparty's expiry.
   * - Typically, in our system, the counterparty's swap expires in 24 hours, and the user's swap expires in 48 hours.
   */
  Expired = 'Expired',
  /**
   * - User refund tx detected on-chain but not confirmed
   */
  RefundDetected = 'RefundDetected',
  /**
   * - User refunded
   * - User can only refund if their swap has expired
   */
  Refunded = 'Refunded',
  /**
   * - Counter party refund tx detected on-chain but not confirmed
   */
  CounterPartyRefundDetected = 'CounterPartyRefundDetected',
  /**
   * - Counter party refunded
   */
  CounterPartyRefunded = 'CounterPartyRefunded',
  /**
   * - Order is cancelled
   * - There are some cases where the order is cancelled:
   *   1) Not matched within 1 hour.
   *   2) Both parties refund.
   */
  Cancelled = 'Cancelled',
}

export enum SwapStatus {
  /**
   * - Swap is idle
   */
  Idle = 'Idle',
  /**
   * - Initiate tx detected on-chain but not confirmed
   */
  InitiateDetected = 'InitiateDetected',
  /**
   * - Swap is initiated
   */
  Initiated = 'Initiated',
  /**
   * - Redeem tx detected on-chain but not confirmed
   */
  RedeemDetected = 'RedeemDetected',
  /**
   * - Redeemed
   */
  Redeemed = 'Redeemed',
  /**
   * - Refund tx detected on-chain but not confirmed
   */
  RefundDetected = 'RefundDetected',
  /**
   * - Refunded
   */
  Refunded = 'Refunded',
  /**
   * - Swap is expired.
   * - Should refund.
   */
  Expired = 'Expired',
}

export enum OrderActions {
  Idle = 'Idle',
  Initiate = 'Initiate',
  Redeem = 'Redeem',
  Refund = 'Refund',
}

export type executeParams = {
  wallets: {
    source: IBitcoinWallet | WalletClient;
    destination: IBitcoinWallet | WalletClient;
  };
  secretManager: ISecretManager;
  blockNumbers?: {
    source: number;
    destination: number;
  };
};

/**
 * This is a generic interface for Order. Use this interface to perform operations on the order (init, redeem, refund, execute).
 */
export interface IOrder {
  /**
   * Get the order details.
   * @returns MatchedOrder
   */
  getOrder(): MatchedOrder;
  /**
   * Initialize the order.
   * Deposit funds into the atomic swap contract.
   */
  init(
    walletClient: WalletClient,
    currentBlockNumber: number,
  ): AsyncResult<string, string>;
  /**
   * Redeem the funds from the atomic swap contract.
   */
  redeem(
    wallet: WalletClient | IBitcoinWallet,
    secret: string,
  ): AsyncResult<string, string>;
  /**
   * Refund the funds from the atomic swap contract after expiry.
   */
  refund(wallet: IBitcoinWallet): AsyncResult<string, string>;
  /**
   * This will take care of order execution according to its current status, i.e., init, redeem, refund.
   *
   * Initiate:- BTC should be done manually, EVM will be automated.
   * Redeem:- Automated for both BTC and EVM.
   * Refund:- Automated for BTC, EVM will be done by the relayer service automatically after expiry.
   */
  execute(params: executeParams): AsyncResult<string | void, string>;
}

export enum OrderCacheAction {
  init = 'init',
  redeem = 'redeem',
  refund = 'refund',
}

export type OrderCacheValue = {
  txHash: string;
  timeStamp: number;
};

export interface IOrderCache {
  getOrder(): MatchedOrder;
  set(action: OrderCacheAction, txHash: string): void;
  get(action: OrderCacheAction): OrderCacheValue | null;
  remove(action: OrderCacheAction): void;
  deleteHistory(): void;
}
