[![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Fcore?style=for-the-badge&logo=npm&label=core&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/core) [![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Forderbook?style=for-the-badge&logo=npm&label=orderbook&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/orderbook) [![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Freact-hooks?style=for-the-badge&logo=npm&label=react-hooks&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/react-hooks)
[![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Futils?style=for-the-badge&logo=npm&label=utils&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/utils)
[![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Fwallet-connectors?style=for-the-badge&logo=npm&label=wallet-connectors&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/wallet-connectors)

# Garden SDK

The Garden SDK is a set of typescript packages that allow you to bridge Bitcoin to EVM-based chains. It is an abstraction over the Garden APIs, allowing developers to easily integrate Garden components into their dApps.

## Packages

- [@gardenfi/orderbook](./packages/orderbook/README.md): Allows you to create orders and listen to them.
- [@gardenfi/core](./packages/core/README.md): Allows you to interact with orders once you setup your wallets.

## Docs

Check out our [docs](https://docs.garden.finance/developers/sdk) to learn more about Garden and how to build on it.

## Contributing

### Setup

This project uses yarn workspaces. Run `yarn` in the directory to install all dependencies.

To build a package, use:

```bash
yarn workspace @gardenfi/<package_name> build
```

To run the development server while building all packages as you develop, use:

```bash
yarn dev
```

To run the development server for the documentation, use:

```bash
yarn start:docs
```
