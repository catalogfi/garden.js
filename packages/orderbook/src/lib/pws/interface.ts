// Pay with seed
import { AsyncResult } from "@catalogfi/utils";

// These types have been copied from the frontend
enum HTLCStatus {
  Pending = "pending",
  Ready = "ready",
  Failed = "failed",
  Expired = "expired",
  RelayerInitiated = "relayer-initiated",
  RelayerRefunded = "relayer-refunded",
  Refunded = "refunded",
  Redeemed = "redeemed",
  Resolved = "resolved",
}

type PendingHTLC = {
  htlcId: number;
  channelId: number;
  processed: boolean;
};

type HTLC = {
  ID: number;
  secretHash: string; // used to create
  secret: string;
  timeLock: number; // used to create
  sendAmount: string; // used to create
  receiveAmount: string; // used to create
  pendingHTLC: PendingHTLC;
  isWithdraw: boolean;
  status: HTLCStatus;
  withdrawNonce: number;
  orderId: string;
  initiateTxHash: string;
  redeemTxHash: string;
  refundTxHash: string;
};

export type PaymentChannelState = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: any;
  latestState: LatestState;
  address: string;
  userId: string;
  feehub: string;
  Balance: string;
  status: string;
  editStatus: string;
  lockedAmount: string;
};

type LatestState = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: any;
  channelId: number;
  htlcs: HTLC[];
  nonce: number;
  amount: string;
  type: string;
  userSignature: string;
  feehubSignature: string;
};

export type ConditionalPaymentInitialRequest = {
  sendAmount: string;
  receiveAmount: string;
  timeLock: number;
  secretHash: string;
};

export type ConditionalPaymentFinalRequest = {
  userSig: string;
  channelId: number;
  htlc: ConditionalPaymentInitialRequest;
};

export interface IPaymentChannelService {
  getChannel(): AsyncResult<PaymentChannelState, string>;
  createChannel(address: string): AsyncResult<PaymentChannelState, string>;
  createConditionalPayment(
    paymentRequest: Omit<ConditionalPaymentInitialRequest, "timelock">
  ): AsyncResult<ConditionalPaymentFinalRequest | null, string>;
  payConditionally(
    paymentRequest: Omit<ConditionalPaymentInitialRequest, "timelock">
  ): AsyncResult<void, string>;
}
