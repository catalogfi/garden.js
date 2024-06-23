---
id: quickstart
---

import DocCardList from '@theme/DocCardList';

# Quickstart

Garden SDK is a set of packages that aims to quickly and seamlessly swap your cross-chain assets.

## Swapping your BTC to WBTC

Swapping from BTC to WBTC will only require two things from you:

- A Bitcoin private key
- An Ethereum private key

The code snippet below swaps your BTC to WBTC on Ethereum. To understand what's happening at each step, take a look at [Swapping from BTC to WBTC](./sdk-guides/SwappingBtcWbtc.md).

```ts
import {
  BitcoinNetwork,
  BitcoinWallet,
  BitcoinProvider,
  EVMWallet,
} from "@catalogfi/wallets";
import {
  Orderbook,
  Chains,
  Assets,
  Actions,
  parseStatus,
} from "@gardenfi/orderbook";
import { GardenJS } from "@gardenfi/core";
import { JsonRpcProvider, Wallet } from "ethers";

// create your bitcoin wallet
const bitcoinWallet = BitcoinWallet.fromPrivateKey(
  "Your PK",
  new BitcoinProvider(BitcoinNetwork.Mainnet)
);

// create your evm wallet
const evmWallet = new EVMWallet(
  new Wallet("Your PK", new JsonRpcProvider("https://rpc.ankr.com/eth"))
);

(async () => {
  const orderbook = await Orderbook.init({
    signer: wallet,
  });

  const wallets = {
    [Chains.bitcoin]: bitcoinWallet,
    [Chains.ethereum]: evmWallet,
  };

  const garden = new GardenJS(orderbook, wallets);

  const sendAmount = 0.0001 * 1e8;
  const receiveAmount = (1 - 0.3 / 100) * sendAmount;

  const orderId = await garden.swap(
    Assets.bitcoin.BTC,
    Assets.ethereum.WBTC,
    sendAmount,
    receiveAmount
  );

  garden.subscribeOrders(await evmWallet.getAddress(), async (orders) => {
    const order = orders.filter((order) => order.ID === orderId)[0];
    if (!order) return;

    const action = parseStatus(order);

    if (action === Actions.UserCanInitiate || Actions.UserCanRedeem) {
      const swapper = garden.getSwap(order);
      const swapOutput = await swapper.next();
      console.log(
        `Completed Action ${swapOutput.action} with transaction hash: ${swapOutput.output}`
      );
    }
  });
})();
```

## Guides

Check out our guides to help you get started on swapping your assets.

<DocCardList
items={[
{
type: "link",
href: "./sdk-guides/creating-wallets",
label: "Creating Wallets",
docId: "developers/sdk/sdk-guides/creating-wallets",
description: "Learn how to create wallets using the @catalogfi/wallets package"
},
{
type: "link",
href: "./sdk-guides/swapping-btc-wbtc",
label: "Swapping from BTC to WBTC",
docId: "developers/sdk/sdk-guides/swapping-btc-wbtc",
description: "Swap BTC to WBTC"
},
{
type: "link",
href: "./sdk-guides/swapping-wbtc-btc",
label: "Swapping from WBTC to BTC",
docId: "developers/sdk/sdk-guides/swapping-wbtc-btc",
description: "Swap WBTC to BTC"
},
{
type: "link",
href: "./sdk-guides/1inch-integration",
label: "1inch Integration",
docId: "developers/sdk/sdk-guides/1inch-integration",
description: "Integrate 1inch into your app to swap anything to BTC or vice versa"
}
]}
/>

## Learn more about Garden SDK

Learn more about the **Garden SDK** by exploring the supported assets, chains, and underlying concepts.

<DocCardList
items={[
{
type: "link",
href: "core-concepts",
label: "Core Concepts",
docId: "developers/sdk/core-concepts",
description: "Learn how swapping works under the hood"
},
{
type: "link",
href: "supported-chains",
label: "Supported Chains",
docId: "developers/sdk/supported-chains",
description: "Find out all the supported chains & assets supported by Garden SDK"
}
]}
/>
