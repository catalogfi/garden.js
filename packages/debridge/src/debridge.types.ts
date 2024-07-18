import { AsyncResult } from '@catalogfi/utils';
import { Provider } from 'ethers';

export interface IDebridge {
  createTx(
    createTxConfig: CreateTxConfig
  ): AsyncResult<CreateTxResponse, string>;
  swap(swapConfig: SwapConfig): AsyncResult<SwapResponse, string>;
  getTxs(
    getTxsConfig: GetTxsConfig
  ): AsyncResult<GetDebridgeTxsResponse, string>;
  getTx(txHash: string): AsyncResult<GetDebridgeTxsResponse, string>;
  getPoints(address: string): AsyncResult<DeBridgePoints, string>;
}

export type GetTxsConfig = {
  chainIdsFrom: string[];
  chainIdsTo: string[];
  address: string;
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

type EthTransaction = {
  to: string;
  data: string;
  value: string;
  gasLimit?: number;
};

export type CreateTxResponse = {
  quote: string;
  tx: EthTransaction;
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
  provider: Provider;
  authToken: string;
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
