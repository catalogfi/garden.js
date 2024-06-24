[![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Fcore?style=for-the-badge&logo=npm&label=core&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/core) [![NPM Version](https://img.shields.io/npm/v/%40gardenfi%2Forderbook?style=for-the-badge&logo=npm&label=orderbook&color=B1D8B7)](https://www.npmjs.com/package/@gardenfi/orderbook)

# Garden SDK

The Garden SDK is a set of typescript packages that allow you to bridge Bitcoin to EVM-based chains. It is an abstraction over the Garden APIs, allowing developers to easily integrate Garden components into their dApps.

## Pacakges

- [@gardenfi/orderbook](./packages/orderbook/README.md): Allows you to create orders and listen to them.
- [@gardenfi/core](./packages/core/README.md): Allows you to interact with orders once you setup your wallets.

## Docs

Docs, guides and internal working is available [here](https://docs.garden.finance/developers/sdk/introduction).

## Contributing

### Setup

This project uses `yarn workspaces`. Run `yarn` in the directory to install all packages.

To build a package:

`yarn workspace @gardenfi/<package_name> build`

To run the development server while building all packages as you develop run:

`yarn dev`

To run the development server for docs run:

`yarn start:docs`
