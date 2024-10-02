export { Garden } from './lib/garden/garden';
export type { IGardenJS } from './lib/garden/garden.types';

export { EvmRelay } from './lib/evmRelay/evmRelay';
export type { IEVMRelay } from './lib/evmRelay/evmRelay.types';

export { Order } from './lib/orderExecutor/order';
export type {
  IOrder,
  OrderStatus,
  SwapStatus,
  OrderActions,
} from './lib/orderExecutor/order.types';
export {
  fetchBitcoinBlockNumber,
  fetchL1BlockNumber,
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
