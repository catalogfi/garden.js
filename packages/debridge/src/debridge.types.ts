import { AsyncResult } from '@catalogfi/utils';
import { JsonRpcSigner, Wallet } from 'ethers';
import { DeBridgeTransaction, Estimation, Order } from './debridge.api.types';
import { Transport, WalletClient } from 'viem';

export interface IDebridge {
  quote(
    quoteConfig: QuoteConfig,
    abortController: AbortController
  ): AsyncResult<QuoteResult, DeBridgeErrorCodes>;
  swap(swapConfig: SwapConfig): AsyncResult<SwapResponse, string>;
  getTxs(
    getTxsConfig: GetTxsConfig
  ): AsyncResult<GetDebridgeTxsResponse, string>;
  getTx(txHash: string): AsyncResult<GetDebridgeTxsResponse, string>;
  getPoints(address: string): AsyncResult<DeBridgePoints, string>;
}

export type SwapTokenMetadata = {
  chainId: number;
  address: string;
  decimals: number;
};

export type QuoteConfigWithoutAmount = {
  fromToken: SwapTokenMetadata;
  toToken: SwapTokenMetadata;
  fromAddress: string;
  toAddress: string;
};

export type QuoteConfigWithFromAmount = QuoteConfigWithoutAmount & {
  fromAmount: string;
};

export type QuoteConfigWithToAmount = QuoteConfigWithoutAmount & {
  toAmount: string;
};

export type QuoteConfig = QuoteConfigWithFromAmount | QuoteConfigWithToAmount;

export type QuoteResponse = {
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

export type QuoteResult = {
  quote: string;
  tx: EthTransaction;
};

export type GetTxsConfig = {
  chainIdsFrom?: string[];
  chainIdsTo?: string[];
  address: string;
};

type EthTransaction = {
  to: string;
  data: string;
  value: string;
  gasLimit?: number;
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

export type SwapConfig = QuoteConfig & {
  client: WalletClient<Transport<'http'>>;
};

export type SwapResponse = {
  txHash: string;
  quote: string;
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
