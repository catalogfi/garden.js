import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./packages/garden-components/vite.config.ts",
  "./packages/orderbook/vite.config.ts",
  "./packages/example/vite.config.ts",
  "./packages/core/vite.config.ts"
])
