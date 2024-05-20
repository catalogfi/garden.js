---
sidebar_position: 7
id: sdk
type: doc
---

# Garden SDK

The `Garden SDK` is a typescript monorepo library that allows you to interact with [Garden](https://garden.finance) allowing you to bridge Bitcoin to EVM based chains and vice versa.

The `Garden SDK` allows you to seamlessly create "Orders" and interact with them. Interacting with an order includes:

-   Initiating
-   Redeeming
-   Refunding

An "Order" is simply creating two atomic swaps on the source and destination chain and successfully moving assets within those chains.

## Packages

-   [Orderbook](../sdk/packages/orderbook/Orderbook.md): `@gardenfi/orderbook` allows you to create orders and listen to them.
-   [Core](../sdk/packages/core/GardenJS.md): `@gardenfi/core` allows you to create, listen and interact with orders.

## Contributing

`Garden SDK` is open source and and we welcome contributions from the community.

### Setup

This monorepo uses `yarn v4.1.1`. To switch to this version, enable corepack (using `corepack enable`) and use `yarn set version 4.1.1`.

To build a package:

`yarn workspace @gardenfi/<package_name> build`

To run the development server that builds all packages as you develop run:

`yarn dev`

When creating a PR:

-   Fork the repo
-   Run `yarn` to install all dependencies
-   Make a PR from your fork to the main repo including your changes and a changelog
