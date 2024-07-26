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
    tokenInMetadata?: TokenMetadata;
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

export type QuoteQueryParams = {
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

export type DeBridgeToken = {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  amount: string;
  approximateOperatingExpense: string;
  mutatedWithOperatingExpense: boolean;
};

export type SrcChainTokenIn = DeBridgeToken & {
  approximateOperatingExpense: string;
  mutatedWithOperatingExpense: boolean;
};

export type SrcChainTokenOut = DeBridgeToken & {
  maxRefundAmount: string;
};

export type DstChainTokenOut = DeBridgeToken & {
  recommendedAmount: string;
  withoutAdditionalTakerRewardsAmount: string;
  maxTheoreticalAmount: string;
};

export type Estimation = {
  srcChainTokenIn: SrcChainTokenIn;
  srcChainTokenOut: SrcChainTokenOut;
  dstChainTokenOut: DstChainTokenOut;
  recommendedSlippage: number;
  costsDetails: string[];
};

export type Order = {
  approximateFulfillmentDelay: number;
};
