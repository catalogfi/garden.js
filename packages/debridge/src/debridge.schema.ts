import { array, mixed, number, object, string } from 'yup';

const BytesSchema = object({
  bytesValue: string().required(),
  bytesArrayValue: array(number()).required(),
  bigIntegerValue: number().required(),
  stringValue: string().required(),
});

const BytesValueSchema = object({
  bytesValue: string().required(),
  bytesArrayValue: array(number()).required(),
  stringValue: string().required(),
});

const Base64Schema = object({
  Base64Value: string().required(),
  bytesArrayValue: array(number()).required(),
  stringValue: string().required(),
});

const TokenMetadataSchema = object({
  decimals: number().required(),
  name: string().required(),
  symbol: string().required(),
});

const MetadataSchema = object({
  chainId: BytesSchema.required(),
  tokenAddress: Base64Schema.required(),
  amount: BytesSchema.required(),
  finalAmount: BytesSchema.required(),
  metadata: TokenMetadataSchema.required(),
  decimals: number().required(),
  name: string().required(),
  symbol: string().required(),
  logoURI: string().required(),
});

export const DeBridgeTransaction = object({
  orderId: BytesValueSchema.required(),
  creationTimestamp: number().required(),
  giveOfferWithMetadata: MetadataSchema.required(),
  takeOfferWithMetadata: MetadataSchema.required(),
  state: string().required(),
  externalCallState: string().required(),
  finalPercentFee: BytesSchema.required(),
  fixFee: BytesSchema.required(),
  affiliateFee: object({
    beneficiarySrc: Base64Schema.required(),
    amount: BytesSchema.required(),
  }),
  unlockAuthorityDst: Base64Schema.required(),
  createEventTransactionHash: BytesSchema.required(),
  preswapData: object({
    chainId: BytesSchema.required(),
    inTokenAddress: Base64Schema.required(),
    inAmount: BytesSchema.required(),
    tokenInMetadata: TokenMetadataSchema.required(),
    tokenInLogoURI: string().required(),
    outTokenAddress: Base64Schema.required(),
    outAmount: BytesSchema.required(),
    tokenOutMetadata: TokenMetadataSchema.required(),
    tokenOutLogoURI: string().required(),
  }),
  orderMetadata: object({
    version: number().required(),
    creationProcessType: string().required(),
    origin: string().required(),
    additionalTakerIncentiveBps: number().required(),
    operatingExpensesAmount: string().required(),
    recommendedTakeAmount: string().required(),
    metadata: string().required(),
  }).required(),
});

export const GetDebridgeTxsResponseSchema = object({
  totalCount: number().required(),
  orders: array(DeBridgeTransaction).required(),
});

export const DeBridgePointsSchema = object({
  userRank: number().required(),
  totalPoints: number().required(),
  activeMultiplier: number().required(),
  finalMultiplier: number().required(),
  nft: mixed().nullable(),
  originMultiplier: mixed().nullable(),
}).required();
