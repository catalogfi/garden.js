export { Garden } from './lib/garden/garden';
export type {
  IGardenJS,
  SwapParams,
  TimeLocks,
} from './lib/garden/garden.types';

export { EvmRelay } from './lib/evmRelay/evmRelay';
export type { IEVMRelay } from './lib/evmRelay/evmRelay.types';

export { OrderExecutor } from './lib/orderExecutor/orderExecutor';
export type {
  IOrderExecutor,
  OrderStatus,
  SwapStatus,
  OrderActions,
} from './lib/orderExecutor/orderExecutor.types';
export {
  fetchBitcoinBlockNumber,
  fetchEVMBlockNumber,
} from './lib/orderExecutor/blockNumber';
export {
  parseAction,
  ParseOrderStatus,
  ParseSwapStatus,
} from './lib/orderExecutor/orderStatusParser';

export { SecretManager } from './lib/secretManager/secretManager';
export type {
  ISecretManager,
  Secret,
} from './lib/secretManager/secretManager.types';

export { Quote } from './lib/quote/quote';
export type { IQuote } from './lib/quote/quote.types';
