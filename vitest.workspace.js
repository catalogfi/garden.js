import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/core/vite.config.ts',
  './packages/orderbook/vite.config.ts',
  './packages/paymentChannel/vite.config.ts',
  './packages/stake/vite.config.ts',
  './packages/utils/vite.config.ts',
  './packages/walletConnectors/vite.config.ts',
]);
