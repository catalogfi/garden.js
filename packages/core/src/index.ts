export { Garden } from './lib/garden/garden';
export type {
  IGardenJS,
  SwapParams,
  GardenEvents,
  IOrderExecutorCache,
  OrderCacheValue,
  EventCallback,
  OrderWithStatus,
  GardenCoreConfig,
  GardenWalletModules,
  GardenHTLCModules,
  GardenConfigWithWallets,
  GardenConfigWithHTLCs,
} from './lib/garden/garden.types';
export { OrderActions } from './lib/garden/garden.types';

export { EvmRelay } from './lib/evm/relay/evmRelay';
export type { IEVMRelay } from './lib/evm/relay/evmRelay.types';
export type { IEVMHTLC } from './lib/evm/htlc.types';

export { StarknetRelay } from './lib/starknet/relay/starknetRelay';
export type { IStarknetHTLC } from './lib/starknet/starknetHTLC.types';
export { StarknetHTLC } from './lib/starknet/htlc/starknetHTLC';

export { SolanaRelay } from './lib/solana/relayer/solanaRelay';
export type { ISolanaHTLC } from './lib/solana/htlc/ISolanaHTLC';
export { SolanaHTLC } from './lib/solana/htlc/solanaHTLC';

export { BlockNumberFetcher } from './lib/blockNumberFetcher/blockNumber';
export type { IBlockNumberFetcher } from './lib/blockNumberFetcher/blockNumber';

export { OrderStatus, SwapStatus } from './lib/orderStatus/status';

export {
  parseAction,
  ParseOrderStatus,
  ParseSwapStatus,
  isExpired,
  filterDeadlineExpiredOrders,
  parseActionFromStatus,
} from './lib/orderStatus/orderStatusParser';

export { SecretManager } from './lib/secretManager/secretManager';
export type {
  ISecretManager,
  Secret,
} from './lib/secretManager/secretManager.types';
export {
  checkAllowanceAndApprove as checkStarknetAllowanceAndApprove,
  isAllowanceSufficient as isStarknetAllowanceSufficient,
  checkAllowance as checkStarknetAlloance,
} from './lib/starknet/checkAllowanceAndApprove';

export { Quote } from './lib/quote/quote';
export type {
  IQuote,
  QuoteResponse,
  Strategies,
} from './lib/quote/quote.types';

export {
  constructOrderPair,
  validateBTCAddress,
  toXOnly,
  resolveApiConfig,
} from './lib/utils';

export {
  evmToViemChainMap,
  switchOrAddNetwork,
  hyperliquidTestnet,
  hyperliquid,
  botanixMainnet as botanix,
} from './lib/switchOrAddNetwork';

export {
  API,
  STARKNET_CONFIG,
  SolanaRelayerAddress,
  solanaProgramAddress,
} from './lib/constants';
