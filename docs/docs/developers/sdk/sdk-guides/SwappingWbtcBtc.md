---
id: swapping-wbtc-btc
---

# Swapping from WBTC to BTC

:::info
Pre-requisites:

- [Creating Wallets](./CreatingWallets.md)
- [Swapping from BTC to WBTC](./SwappingBtcWbtc.md)
  :::

In this guide, we'll be swapping from WBTC to BTC on Ethereum.

## Swapping

To swap from WBTC to BTC, you can reuse most of the code described in the [Swapping from BTC to WBTC](./SwappingBtcWbtc.md). The only difference is to swap the `from` and `to` asset parameters in the `GardenJS.swap(..)` method. As described in the other guide, we'll be swapping 0.0001 BTC and pay a fee of 0.3%.

```ts
import { Assets } from "@gardenfi/orderbook";

const sendAmount = 0.0001 * 1e8;
const receiveAmount = (1 - 0.3 / 100) * sendAmount;

const orderId = await garden.swap(
  Assets.ethereum.WBTC,
  Assets.bitcoin.BTC,
  sendAmount,
  receiveAmount
);
```
