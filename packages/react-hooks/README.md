# @gardenfi/react-hooks

The `@gardenfi/react-hooks` package provides React hooks and context providers for integrating Garden.fi's cross-chain atomic swap functionality into React applications. It includes a context provider for global state management and hooks that provide a unified interface for quote retrieval and atomic swap execution. The package handles automatic cleanup of subscriptions and provides real-time updates for order status changes.

## Installation

```
yarn add @gardenfi/react-hooks
```

## Setup

### Vite

Install the vite plugins:

```
npm install vite-plugin-wasm vite-plugin-top-level-await vite-plugin-node-polyfills --save-dev
```

and update your `vite.config.ts` as follows:

```typescript
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    nodePolyfills(),
    wasm(),
    topLevelAwait(),
    //other plugins
  ],
  //other settings
});
```

### Webpack

If you're using webpack with a framework like next, then in your webpack config, (if you're using NextJS, this can be found in `next.config.js` ) add support for wasm as shown below:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  //other nextConfig options
  webpack: function (config, options) {
    //other webpack config options
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};
module.exports = nextConfig;
```



## Usage

### Setup GardenProvider

```tsx
import { GardenProvider } from '@gardenfi/react-hooks';

const gardenConfig = {
  environment: 'testnet',
  wallets: {
    evm: {
      // EVM wallet configuration
    },
    // Additional wallet configurations (bitcoin, starknet, solana) can be added as needed
  },
};

function App() {
  return (
    <GardenProvider config={gardenConfig}>
      <YourApp />
    </GardenProvider>
  );
}
```