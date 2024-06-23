---
id: swapping-btc-wbtc
---

import InstallAlert from "../\_install-alert.mdx";

# Swapping from BTC to WBTC

<InstallAlert/>
:::info
Pre-requisites:

- [Creating Wallets](./CreatingWallets.md)
  :::

In this guide, we'll be swapping BTC to WBTC on Ethereum.

## Creating the Wallets

We'll need a Bitcoin and an EVM wallet to do the swap. The process is the same as described in [Creating Wallets](./CreatingWallets.md). If you are implementing the following in a browser you may need wasm support and pollyfills for bitcoin wallet.

**You'll need:**

1. Your Bitcoin private key or a signer from your Web3 provider to create a Bitcoin OTA
2. Your Ethereum private key or a signer from your Web3 provider

:::warning
Make sure these wallets are funded before doing the swap!
:::

```ts
import {
  BitcoinNetwork,
  BitcoinWallet,
  BitcoinProvider,
  EVMWallet,
} from "@catalogfi/wallets";
import { JsonRpcProvider, Wallet } from "ethers";

const bitcoinProvider = new BitcoinProvider(BitcoinNetwork.Mainnet);
const bitcoinPk = "YOUR BITCOIN PRIVATE KEY";

const bitcoinWallet = BitcoinWallet.fromPrivateKey(bitcoinPk, bitcoinProvider);

const ethereumPk = "YOUR ETHEREUM PRIVATE KEY";
const ethereumProvider = new JsonRpcProvider("https://rpc.ankr.com/eth");
const signer = new Wallet(ethereumPk, ethereumProvider);

const evmWallet = new EVMWallet(signer);
```

:::note
Checkout [Creating Wallets](./CreatingWallets.md) for more information on creating wallets without private keys.
:::

## Creating the Orderbook Instance

The orderbook keeps track of all your "orders." An "order" is simply a request to swap your BTC to WBTC (or vice versa) to the backend Garden systems. The `Orderbook` in `@gardenfi/orderbook` allows you to create orders and listen to them.

To create the orderbook you need a signer. The reason a signer is needed is to sign a [siwe](https://eips.ethereum.org/EIPS/eip-4361) message and authenticate itself with the backend orderbook. The orderbook can be created using the constructor or using the `.init(..)` method. In this example we'll be using the latter as it also performs [siwe](https://eips.ethereum.org/EIPS/eip-4361) authentication.

:::note
The signer which `Orderbook.init` accepts is an instance of `JsonRpcSigner` from ethers@6.8.0
:::

```ts
import { Orderbook } from "@gardenfi/orderbook";

// we can use the following signer if you are using a web3 provider
// const signer = await new BrowserProvider(window.ethereum).getSigner();

(async () => {
  const orderbook = await Orderbook.init({
    signer, // use the signer from above code snippet
  });
})();
```

You can pass following options to the `Orderbook.init` method:

```typescript
opts: {
  store: IStore, // Used for caching auth tokens
  domain: string, // this domain is used to create the siwe message
}
```

`IStore` is compatible with the `localStorage` API. You can pass browser's `localStorage` or any other store that implements the same API.

:::note
From now the rest of the code will be written inside this async block.
:::

## Swapping

To swap BTC to WBTC, we'll make use of the `GardenJS` in `@gardenfi/core`. The core package is responsible for executing swaps.

To create the `GardenJS` instance, we'll need the wallet object and orderbook we created before. The wallet object should be such that the keys are the chains and the values are the wallets. Checkout supported chains in [Supported Chains](../SupportedChains.md)

```ts
import { Chains } from "@gardenfi/orderbook";
import { GardenJS } from "@gardenfi/core";

const wallets = {
  [Chains.bitcoin]: bitcoinWallet,
  [Chains.ethereum]: evmWallet,
};

const garden = new GardenJS(orderbook, wallets);
```

Now that we have the Garden instance, we can swap BTC for WBTC. The first step is to create the swap request. We use the `gardenJS.swap()` to create the swap. The minimum amount required is 0.0001 BTC and we'll be paying a fee of 0.3% to the fillers. The `.swap()` method however accepts the send and receive amount in their lowest denominations (in the case of BTC it's satoshis).

We'll also need to specify the assets we want to swap from and to. Since we want to swap from BTC on the Bitcoin chain to WBTC and Ethereum. These assets are specified in the `Assets` object.

```ts
import { Assets } from "@gardenfi/orderbook";

const sendAmount = 0.0001 * 1e8;
const receiveAmount = (1 - 0.3 / 100) * sendAmount;

const orderId = await garden.swap(
  Assets.bitcoin.BTC,
  Assets.ethereum.WBTC,
  sendAmount,
  receiveAmount
);
```

This is just making a swap request. An actual swap happens if the filler accepts the request.
If you need to do anything related to your order, you will need the order ID.

If a filler accepts our swap request, a series of steps need to be performed, and all of this has been abstracted in `GardenJS`. To learn more about this process, take a look at [Core Concepts](../CoreConcepts.md).

We have just created a _swap request aka an order_. From now on we treat the swap request as an order. Any changes made to an order, like a filler filling it or user locking funds, will be updated via watchers in the backend orderbook. More on [Core Concepts](../CoreConcepts.md).

To listen to orders created by your EVM address, you will need to subscribe to them by passing the EVM address you used to create the order.

```ts
import { Actions, parseStatus } from "@gardenfi/orderbook";

garden.subscribeOrders(await evmWallet.getAddress(), async (orders) => {
  // filter the order we have just created
  const order = orders.filter((order) => order.ID === orderId)[0];
  if (!order) return;

  // get the action we can perform on the order right now
  const action = parseStatus(order);

  if (action === Actions.UserCanInitiate || action === Actions.UserCanRedeem) {
    const swapper = garden.getSwap(order);
    // if it is UserCanInitiate, this step will lock the funds in the contract.
    // if it is UserCanRedeem, this step will unlocks the funds from the contract.
    const performedAction = await swapper.next();
    console.log(
      `Completed Action ${performedAction.action} with transaction hash: ${performedAction.output}`
    );
  }
});
```

Inside the callback, we filter out the order we created. This is because orders can also include other order updates that you may have created previously.

We only want to progress on our swap when we can initiate or redeem. We parse the order status and compare it with the `Actions` enum. If true, we will progress the swap using the `next()` method on the swapper.

The complete code is available on the [Quickstart](../Quickstart.md).
