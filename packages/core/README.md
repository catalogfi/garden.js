[![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Fcore?style=for-the-badge&logo=npm&label=core&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/core)

![Contributors](https://img.shields.io/github/contributors/catalogfi/garden.js.svg?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/catalogfi/garden.js.svg?style=for-the-badge)
![Stargazers](https://img.shields.io/github/stars/catalogfi/garden.js.svg?style=for-the-badge)
![Issues](https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge)

# @gardenfi/core

The `@gardenfi/core` package provides an abstraction layer over the `@catalogfi/wallets` (which contains different types of Bitcoin and EVM wallets) and `@gardenfi/orderbook` packages. It offers a simple interface for performing atomic swaps.

## Table of Contents

1. [Installation](#installation)
2. [Setup](#setup)
   1. [Node](#node)
   2. [Browser](#browser)
      1. [Vite](#vite)
      2. [Webpack](#webpack)
3. [Documentation](#documentation)
4. [Contributions](#contributions)
5. [License](#license)
6. [Keep Updated](#stay-updated)

## Installation

You can install the package via npm or yarn:

```bash
npm install @gardenfi/core
```

or

```bash
yarn add @gardenfi/core
```

## Setup

### Node

No extra setup is required as both `cjs` and `esm` modules are supported.

### Browser

Following cases only cover vite and webpack setups. For other bundlers, please refer to their respective documentation on how to add wasm and polyfills support.

### Vite

Install the vite plugins:

```bash
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

## Documentation

[Garden Docs](https://docs.garden.finance/)

## Contributing

We welcome contributions to the `@gardenfi/core` package! If you're interested in contributing, please follow these steps:

### 1. Fork the Repository

Start by forking the repository to your GitHub account.

### 2. Clone the Forked Repository

Clone the forked repository to your local machine:

```bash
git clone https://github.com/catalogfi/garden.js.git
cd core
```

### 3. Create a New Branch

Create a feature or bug-fix branch for your changes:

```bash
git checkout -b feature/my-feature
```

### 4. Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

### 5. Make changes

Edit the codebase to add features, fix bugs, or update documentation.

### 6. Run tests

Before submitting your changes, ensure all tests pass:

```bash
yarn test
```

### 7. Commit and push changes

Commit your changes with a meaningful commit message:

```bash
git commit -m "Add my new feature"
```

Push your branch to your forked repository:

```bash
git push origin feature/my-feature
```

### 8. Create a pull request

Open a pull request (PR) to the main repository and describe your changes in detail. Link any related issues if applicable.

## Stay updated

- [Follow our GitHub repository](https://github.com/catalogfi)
- [Join our Discord community](https://discord.com/invite/gardenfi)
- [Visit our Garden Docs](https://garden.finance/)

### Top contributors:

<a target="_blank" href="https://github.com/catalogfi/garden.js/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=catalogfi/garden.js" alt="contrib.rocks image" />
</a>
