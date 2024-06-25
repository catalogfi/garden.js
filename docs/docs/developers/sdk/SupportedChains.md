---
id: supported-chains
---

# Supported Chains

:::note
SDK also supports EVM localnets and bitcoin regtest. This is possible with `merry`, a complete localnet environment setup for testing the Garden systems. If merry is not running, whenever you pass localnets to the SDK, it will throw an error saying unsupported asset.
:::

**Garden supports the following chains:**

-   Bitcoin
-   Ethereum
-   Arbitrum

We use **WBTC** as the base asset for EVM-based chains.

**The following swaps are supported:**

-   BTC to WBTC (Bitcoin -> Ethereum)
-   WBTC to WBTC (Ethereum -> Arbitrum)

:::note
From chain and to chain are interchangeable here.
:::

## How do I get the supported chains?

`@gardenfi/orderbook` exports a constant called `Chains` which contains all supported chains.

```ts
import { Chains } from "@gardenfi/orderbook";

const bitcoin = Chains.bitcoin;
const ethereum = Chains.ethereum;
const arbitrum = Chains.ethereum_arbitrum;
```

## How do I specify an asset on the X chain?

`@gardenfi/orderbook` exports a constant called `Assets` which contains respective chains and it's supported assets.

```ts
import { Assets } from "@gardenfi/orderbook";

const wbtcOnEthereum = Assets.ethereum.WBTC;
const wbtcOnArbitrum = Assets.ethereum_arbitrum.WBTC;
const btc = Assets.bitcoin.BTC;
```

Now, these can be passed to `swap()` gardenJS to perform swaps. Checkout swap example in [Swapping from BTC to WBTC](./sdk-guides/SwappingBtcWbtc.md).

## Contracts

Garden uses the following contracts to perform swaps on respective chains:

| Chain    |                                                       Contract                                                        |
| -------- | :-------------------------------------------------------------------------------------------------------------------: |
| Bitcoin  |                     [HTLC](https://github.com/catalogfi/swapper/blob/main/bitcoin/AtomicSwap.ts)                      |
| Ethereum | [0xa5e38d098b54c00f10e32e51647086232a9a0afd](https://etherscan.io/address/0xa5e38d098b54c00f10e32e51647086232a9a0afd) |
| Arbitrum | [0x203DAC25763aE783Ad532A035FfF33d8df9437eE](https://arbiscan.io/address/0x203DAC25763aE783Ad532A035FfF33d8df9437eE)  |
