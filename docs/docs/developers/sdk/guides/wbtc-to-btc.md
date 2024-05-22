---
sidebar_position: 3
id: wbtc-to-btc
---

# Swapping from WBTC to BTC

:::info

### Pre-requisites:

-   [Creating wallets](./creating-wallets)
-   [Swapping from BTC to WBTC](./btc-to-wbtc)
    <!-- prettier-ignore -->
:::

In this guide we'll be swapping from WBTC on Ethereum to BTC.

## Swapping

To swap from WBTC to BTC, you can reuse most of the code described in the [swapping from btc to wbtc page](./btc-to-wbtc). The only difference is to swap the `from` and `to` asset parameters in the `GardenJS.swap(..)` method. As described in the other guide, we'll be swapping 0.0001 BTC and pay a fee of `0.3%`.

```ts
import { Assets } from "@gardenfi/orderbook";

const sendAmount = 0.0001 * 1e8;
const recieveAmount = (1 - 0.3 / 100) * sendAmount;

const orderId = await garden.swap(
    Assets.ethereum.WBTC,
    Assets.bitcoin.BTC,
    sendAmount,
    recieveAmount
);
```
