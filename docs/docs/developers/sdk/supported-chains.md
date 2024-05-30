---
sidebar_position: 6
id: supported-chains
---

# Supported chains

Garden supports the following chains:

-   **Bitcoin**
-   **Ethereum**
-   **Arbitrum**
-   **Polygon (Coming soon)**

We use `WBTC` as the base asset for EVM based chains.

The following swaps are supported:

-   BTC to WBTC (bitcoin -> ethereum)
-   WBTC to WBTC (ethereum -> arbitrum)

> ❗ Note:
> From chain and to chain are interchangeable here.

## How do I get the supported chains?

`@gardenfi/orderbook` exports a constant called `Chains` which contains supported chains.

```javascript
import { Chains } from "@gardenfi/orderbook";

const bitcoin = Chains.bitcoin;
const ethereum = Chains.ethereum;
const arbitrum = Chains.ethereum_arbitrum;
```

## How do I specify an asset on X chain?

`@gardenfi/orderbook` exports a constant called `Assets` which contains respective chains and it's supported assets.

```javascript
import { Assets } from "@gardenfi/orderbook";

const wbtcOnEthereum = Assets.ethereum.WBTC;
const wbtcOnArbitrum = Assets.ethereum_arbitrum.WBTC;
const btc = Assets.bitcoin.BTC;
```

Now these can be passed to `swap()` of gardenJS to perform swaps. Checkout swap example in [here](./guides/btc-to-wbtc.md).

## Contracts

Garden uses the following contracts to perform swaps on respective chains:

| Chain    |                                                       Contract                                                        |
| :------- | :-------------------------------------------------------------------------------------------------------------------: |
| Bitcoin  |                     [HTLC](https://github.com/catalogfi/swapper/blob/main/bitcoin/AtomicSwap.ts)                      |
| Ethereum | [0xa5e38d098b54c00f10e32e51647086232a9a0afd](https://etherscan.io/address/0xa5e38d098b54c00f10e32e51647086232a9a0afd) |
| Arbitrum | [0x203DAC25763aE783Ad532A035FfF33d8df9437eE](https://arbiscan.io/address/0x203DAC25763aE783Ad532A035FfF33d8df9437eE)  |
