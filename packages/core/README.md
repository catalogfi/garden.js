# @gardenfi/core

The `@gardenfi/core` package handles atomic swaps between different blockchains. It provides an interface for applications to integrate the Garden SDK. The Garden instance provides all required functionalities such as quote generation, swap initiation, HTLC interactions, and wallet operations.

## Installation

```
yarn add `@gardenfi/core`
```

## Usage

1. Creating an atomic swap: ([should create an order with valid parameters](https://github.com/hashiraio/garden.js/blob/main/packages/core/src/lib/garden/garden.spec.ts#L150))
2. Interacting with created orders: ([should initiate and redeem](https://github.com/hashiraio/garden.js/blob/main/packages/core/src/lib/garden/garden.spec.ts#L197))

## Setup

### Node

No extra setup is required as both `cjs` and `esm` modules are supported.

### Browser

Following cases only cover vite and webpack setups. For other bundlers, please refer to their respective documentation on how to add wasm and polyfills support.

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
