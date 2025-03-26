export { Garden } from './lib/garden/garden';
export type {
  IGardenJS,
  SwapParams,
  GardenEvents,
  IOrderExecutorCache,
  OrderCacheValue,
  EventCallback,
  OrderWithStatus,
} from './lib/garden/garden.types';
export { OrderActions } from './lib/garden/garden.types';

export { EvmRelay } from './lib/evm/relay/evmRelay';
export type { IEVMRelay } from './lib/evm/relay/evmRelay.types';
export type { IEVMHTLC } from './lib/evm/htlc.types';

export { StarknetRelay } from './lib/starknet/relay/starknetRelay';
export type { IStarknetHTLC } from './lib/starknet/starknetHTLC.types';
export { StarknetHTLC } from './lib/starknet/htlc/starknetHTLC';

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

export { Quote } from './lib/quote/quote';
export type {
  IQuote,
  QuoteResponse,
  Strategies,
} from './lib/quote/quote.types';

export { constructOrderPair, validateBTCAddress } from './lib/utils';

export {
  evmToViemChainMap,
  switchOrAddNetwork,
} from './lib/switchOrAddNetwork';

export { API } from './lib/constants';
