import { AsyncResult } from '@catalogfi/utils';
import { JsonRpcSigner, Wallet } from 'ethers';

export interface IDebridge {
  createTx(
    createTxConfig: CreateTxConfig,
    abortController: AbortController
  ): AsyncResult<CreateTxResult, DeBridgeErrorCodes>;
  swap(swapConfig: SwapConfig): AsyncResult<SwapResponse, string>;
  getTxs(
    getTxsConfig: GetTxsConfig
  ): AsyncResult<GetDebridgeTxsResponse, string>;
  getTx(txHash: string): AsyncResult<GetDebridgeTxsResponse, string>;
  getPoints(address: string): AsyncResult<DeBridgePoints, string>;
}

export type GetTxsConfig = {
  chainIdsFrom?: string[];
  chainIdsTo?: string[];
  address: string;
};

export type CreateTxResult = {
  quote: string;
  tx: EthTransaction;
};

export type CreateTxConfig = {
  srcChainId: number;
  srcChainTokenIn: string;
  srcTokenDecimals: number;
  sellAmount: string;
  isExactOut: boolean;
  dstChainId: number;
  dstChainTokenOut: string;
  dstChainTokenOutRecipient: string;
  senderAddress: string;
};

export type CreateTxQueryParams = {
  srcChainId: number;
  srcChainTokenIn: string;
  srcChainTokenInAmount: string;
  dstChainTokenOutAmount?: string;
  dstChainId: number;
  dstChainTokenOut: string;
  dstChainTokenOutRecipient: string;
  senderAddress: string;
  srcChainOrderAuthorityAddress: string;
  referralCode: number;
  srcChainRefundAddress: string;
  dstChainOrderAuthorityAddress: string;
  enableEstimate: boolean;
  additionalTakerRewardBps: number;
  affiliateFeeRecipient: string;
  affiliateFeePercent: number;
};

type EthTransaction = {
  to: string;
  data: string;
  value: string;
  gasLimit?: number;
};

type DeBridgeToken = {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  amount: string;
  approximateOperatingExpense: string;
  mutatedWithOperatingExpense: boolean;
};

type SrcChainTokenIn = DeBridgeToken & {
  approximateOperatingExpense: string;
  mutatedWithOperatingExpense: boolean;
};

type SrcChainTokenOut = DeBridgeToken & {
  maxRefundAmount: string;
};

type DstChainTokenOut = DeBridgeToken & {
  recommendedAmount: string;
  withoutAdditionalTakerRewardsAmount: string;
  maxTheoreticalAmount: string;
};

type Estimation = {
  srcChainTokenIn: SrcChainTokenIn;
  srcChainTokenOut: SrcChainTokenOut;
  dstChainTokenOut: DstChainTokenOut;
  recommendedSlippage: number;
  costsDetails: string[];
};

type Order = {
  approximateFulfillmentDelay: number;
};

export enum DeBridgeErrorCodes {
  INVALID_QUERY_PARAMETERS = 'INVALID_QUERY_PARAMETERS',
  SOURCE_AND_DESTINATION_CHAINS_ARE_EQUAL = 'SOURCE_AND_DESTINATION_CHAINS_ARE_EQUAL',
  AFFILIATE_FEE_PERCENT_NOT_SET = 'AFFILIATE_FEE_PERCENT_NOT_SET',
  AFFILIATE_FEE_RECIPIENT_NOT_SET = 'AFFILIATE_FEE_RECIPIENT_NOT_SET',
  ESTIMATION_FAILED = 'ESTIMATION_FAILED',
  ERROR_LOW_GIVE_AMOUNT = 'ERROR_LOW_GIVE_AMOUNT',
  UNSUPPORTED_TOKEN_IN = 'UNSUPPORTED_TOKEN_IN',
  UNSUPPORTED_TOKEN_OUT = 'UNSUPPORTED_TOKEN_OUT',
  SENDER_ADDRESS_EMPTY = 'SENDER_ADDRESS_EMPTY',
  UNABLE_TO_ESTIMATE_ORDER_FULFILLMENT = 'UNABLE_TO_ESTIMATE_ORDER_FULFILLMENT',
  RATE_OUTDATED = 'RATE_OUTDATED',
  IMPOSSIBLE_ROUTE = 'IMPOSSIBLE_ROUTE',
  INTERMEDIARY_TOKEN_NOT_FUNDED = 'INTERMEDIARY_TOKEN_NOT_FUNDED',
  INTERMEDIARY_TOKEN_APPROVALS_MISSING = 'INTERMEDIARY_TOKEN_APPROVALS_MISSING',
  INTERMEDIARY_TOKEN_NOT_CONFIGURED = 'INTERMEDIARY_TOKEN_NOT_CONFIGURED',
  SAME_SOURCE_AND_DESTINATION_CHAINS = 'SAME_SOURCE_AND_DESTINATION_CHAINS',
  UNABLE_TO_ESTIMATE_EXTERNAL_CALL_WITHOUT_GAS = 'UNABLE_TO_ESTIMATE_EXTERNAL_CALL_WITHOUT_GAS',
  API_CALL_CANCELLED = 'API call canceled',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export type CreateTxResponse = {
  estimation: Estimation;
  tx: EthTransaction;
  orderId: string;
  prependedOperatingExpenseCost: string;
  order: Order;
  fixFee: string;
  userPoints: number;
  integratorPoints: number;
  errorId?: DeBridgeErrorCodes;
};

export type SwapConfig = {
  srcChainId: number;
  srcChainTokenIn: string;
  srcTokenDecimals: number;
  sellAmount: string;
  isExactOut: boolean;
  dstChainId: number;
  dstChainTokenOut: string;
  dstChainTokenOutRecipient: string;
  senderAddress: string;
  signer: JsonRpcSigner | Wallet;
};

export type SwapResponse = {
  txHash: string;
  quote: string;
};

type Bytes = {
  bytesValue: string;
  bytesArrayValue: number[];
  bigIntegerValue: number;
  stringValue: string;
};

type BytesValue = {
  bytesValue: string;
  bytesArrayValue: number[];
  stringValue: string;
};

type Base64 = {
  Base64Value: string;
  bytesArrayValue: number[];
  stringValue: string;
};

type TokenMetadata = {
  decimals: number;
  name: string;
  symbol: string;
};

type Metadata = {
  chainId: Bytes;
  tokenAddress: Base64;
  amount: Bytes;
  finalAmount: Bytes;
  metadata: TokenMetadata;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
};

export type DeBridgeTransaction = {
  orderId: BytesValue;
  creationTimestamp: number;
  giveOfferWithMetadata: Metadata;
  takeOfferWithMetadata: Metadata;
  state: string;
  externalCallState: string;
  finalPercentFee: Bytes;
  fixFee: Bytes;
  affiliateFee: {
    beneficiarySrc: Base64;
    amount: Bytes;
  };
  unlockAuthorityDst: Base64;
  createEventTransactionHash: Bytes;
  preswapData: {
    chainId: Bytes;
    inTokenAddress: Base64;
    inAmount: Bytes;
    tokenInMetadata: TokenMetadata;
    tokenInLogoURI: string;
    outTokenAddress: Base64;
    outAmount: Bytes;
    tokenOutMetadata: TokenMetadata;
    tokenOutLogoURI: string;
  };
  orderMetadata: {
    version: number;
    creationProcessType: string;
    origin: string;
    additionalTakerIncentiveBps: number;
    operatingExpensesAmount: string;
    recommendedTakeAmount: string;
    metadata: string;
  };
};

export type GetDebridgeTxsResponse = {
  totalCount: number;
  orders: DeBridgeTransaction[];
};

export type DeBridgePoints = {
  userRank: number;
  totalPoints: number;
  activeMultiplier: number;
  finalMultiplier: number;
  nft: any;
  originMultiplier: any;
};

export const DebridgeResources = {
  points: (userAddress: string) => `/${userAddress}/summary`,
  tx: '/filteredList',
  createTx: '/dln/order/create-tx',
};
