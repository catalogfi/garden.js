---
id: creating-wallets
---

import InstallAlert from "../\_install-alert.mdx";

# Creating Wallets

To swap from BTC to WBTC or vice versa, you need a wallet to send and receive assets. The `@catalogfi/wallets` package provides different types of wallets for Bitcoin and EVM. With a Bitcoin wallet and an EVM wallet, you can easily make swaps between the two cross-chain assets.

## Installation

<InstallAlert />

To install `@catalogfi/wallets` run:

```shell
npm install @catalogfi/wallets
```

## Creating a Bitcoin Wallet

To create a Bitcoin wallet, you need a private key and a `BitcoinProvider`. A Bitcoin provider is simply a helper class communicating with the blockchain.

```ts
import {
    BitcoinWallet,
    BitcoinProvider,
    BitcoinNetwork,
} from "@catalogfi/wallets";

const provider = new BitcoinProvider(BitcoinNetwork.Mainnet);
const privateKey = "YOUR PRIVATE KEY";

const wallet = BitcoinWallet.fromPrivateKey(privateKey, provider);
```

By default, the wallet uses `p2wpkh` (Pay-to-Witness-Public-Key-Hash) to derive addresses. If you want to use a different address type, you can pass it as the third argument in the `opts` object.

If you don't have access to private keys, you can use Bitcoin OTAs to create one-time Bitcoin accounts. To generate an OTA, you need a signer from your Web3 provider.

```ts
import {
    BitcoinOTA,
    BitcoinProvider,
    BitcoinNetwork,
} from "@catalogfi/wallets";
import { JsonRpcSigner, BrowserProvider } from "ethers";

const provider = new BitcoinProvider(BitcoinNetwork.Mainnet);
const signer = await new BrowserProvider(window.ethereum).getSigner();

const ota = new BitcoinOTA(provider, signer);
```

## Creating an EVM Wallet

To create an EVM wallet, you can either pass a `Wallet` implementation from `ethers.js` or a `JsonRpcSigner` from your Web3 provider.

:::note
@catalogfi/wallets uses ethers version `6.8.0`. Make sure to use the same version in your project.
:::

The process is similar to creating a Bitcoin wallet. You don't need anything other than the private key and the provider.

```ts
import { EVMWallet } from "@catalogfi/wallets";
import { JsonRpcProvider, Wallet } from "ethers";

const provider = new JsonRpcProvider("https://rpc.ankr.com/eth");
const privateKey = "YOUR PRIVATE KEY";
const wallet = new Wallet(privateKey, provider);

const evmWallet = new EVMWallet(wallet);
```

If you don't have access to a private key, you can use the `JsonRpcSigner` from your Web3 provider.

```ts
import { EVMWallet } from "@catalogfi/wallets";
import { JsonRpcSigner, BrowserProvider } from "ethers";

const signer = await new BrowserProvider(window.ethereum).getSigner();
const evmWallet = new EVMWallet(signer);
```
