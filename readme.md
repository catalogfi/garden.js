# Garden SDK

The Garden SDK is a monorepo that is used to interact with the backend orderbook fillers to create orders and interact with them. 

## Pacakges
- [@catalogfi/orderbook](./packages/orderbook): Allows you to create orders and listen to them.
- [@catalogfi/core](./packages/core): Allows you to interact with orders once you setup your wallets. 

## Contributing 

### Setup

This project uses `yarn workspaces`. Run `yarn` in the directory to install all packages.

To build a package: 

`yarn workspace @gardenfi/<package_name> build`

To run the development server while building all packages as you develop run:

`yarn dev`

To run the development server for docs run: 

`yarn start:docs`