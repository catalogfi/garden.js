---
sidebar_position: 1
id: creating-wallets
---

# Creating Wallets

To be able to swap from BTC to WBTC or vice versa, you need a wallet to send funds and receive them. This is done via the `@catalogfi/wallets` package and is pretty simple. To swap from BTC to WBTC, you need a Bitcoin wallet and an EVM wallet.

## Installation

The `@catalogfi/wallets` package is public and be installed from the NPM registry. To install `@catalogfi/wallets` run:

```
npm install @catalogfi/wallets
```

## Creating a Bitcoin Wallet

To create a Bitcoin wallet, you need a privatekey and a `BitcoinProvider`. A Bitcoin provider is simply a wrapper around indexer URLs and provides additional helper functions to help you interact with Bitcoin.

```ts
import {
    BitcoinWallet,
    BitcoinProvider,
    BitcoinNetwork,
    AddressType,
} from "@catalogfi/wallets";

const provider = new BitcoinProvider(BitcoinNetwork.Mainnet);
const privateKey = "YOUR PRIVATE KEY";

const wallet = BitcoinWallet.fromPrivateKey(privateKey, provider);
```

Address types are Bitcoin payment types and in this case we're using a P2WPKH (Pay To Witness Public Key Hash) `AddressType`. This will generate a wallet with a P2WPKH address.

## Creating an EVM Wallet

EVM wallets are (for now) wrappers around ethers.js wallets. To create one, just pass the ether.js wallet in the constructor.

:::note
`@catalogfi/wallets` uses ethers version `6.8.0`.
:::

Install ethers version `6.8.0`.

```sh
npm install ethers@6.8.0
```

The process is similar to creating a Bitcoin wallet. You don't need anything other than the private key and the provider.

```ts
import { EVMWallet } from "@catalogfi/wallets";
import { JsonRpcProvider, Wallet } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");
const privateKey = "YOUR PRIVATE KEY";
const wallet = new Wallet(privateKey, provider);

const evmWallet = new EVMWallet(wallet);
```
