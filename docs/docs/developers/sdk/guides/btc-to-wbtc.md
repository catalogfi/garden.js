---
sidebar_position: 2
id: btc-to-wbtc
---

# Swapping from BTC to WBTC

Swapping from BTC to WBTC requires you to know how to create wallets from the `@catalogfi/wallets` package. If not, then take a look at the [creating wallets](./creating-wallets) guide before to get started with this one.

In this guide we'll be swapping BTC to WBTC on Ethereum.

## Creating the wallets

We'll need a Bitcoin and an EVM wallet to be able to do the swap. The process is same as described in the [creating wallets](./creating-wallets) guide. You'll need:

1. Your Bitcoin private key
2. Your Ethereum private key

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
const wallet = new Wallet(ethereumPk, ethereumProvider);

const evmWallet = new EVMWallet(wallet);
```

## Creating the orderbook instance

The orderbook simply keeps track of all your "orders". An "order" is simply a request to swap your BTC to WBTC (or vice versa) to the backend Garden fillers. The `Orderbook` in `@gardenfi/orderbook` allows you to create orders and listen to them. Before we make a swap, we need the orderbook instance to create orders.

First lets install the `@gardenfi/orderbook` package:

```bash
npm install @gardenfi/orderbook
```

To create the orderbook you need a signer. The reason a signer is used is to sign a siwe message and authenticates itself with the backend orderbook. The orderbook can be created using the constructor or using the `.init` method. In this example we'll be using the latter as it also performs siwe authentication.

```ts
import { Orderbook } from "@gardenfi/orderbook";

(async () => {
    const orderbook = await Orderbook.init({
        signer: wallet,
    });
})();
```

:::note
From now the rest of the code will be written inside this async block.
:::

## Swapping

To swap BTC to WBTC, we'll make use of the `GardenJS` in `@gardenfi/core`. The core package is responsible for executing swaps. To do so, first we'll create a `GardenJS` instance.

Install the `@gardenfi/core` package:

```bash
npm install @gardenfi/core
```

To create the `GardenJS` instance we'll need the wallets and orderbook we've created before. `GardenJS` requires you to create a wallets object. The key of each wallet is the chain (take a look at the [Supported Chains](./supported-chains) to see what chains are supported by the `Garden SDK`) and the value corresponds to the wallet responsible for interacting with that chain.

```ts
import { Chains } from "@gardenfi/orderbook";
import { GardenJS } from "@gardenfi/core";

const wallets = {
    [Chains.bitcoin]: bitcoinWallet,
    [Chains.ethereum]: evmWallet,
};

const garden = new GardenJS(orderbook, wallets);
```

Now that we have the garden object, we can use it to swap BTC to WBTC. The first step is to create the request for this swap with the garden orderbook fillers. This is done using the `swap` method. The minimum amount required is 0.0001 BTC and we'll be paying a fee of 0.3% to the fillers. The `.swap` method however accepts the send and receive amount in their lowest denomincations (in the case of BTC it's satoshis).

We'll also need to specify the assets we want to swap from and to. Since we want to swap from BTC in Bitcoin to WBTC in ethereum, we'll need those assets respectively. These assets are specified in the `Assets` object.

```ts
import { Assets } from "@gardenfi/orderbook";

const sendAmount = 0.0001 * 1e8;
const recieveAmount = (1 - 0.3 / 100) * sendAmount;

const orderId = await garden.swap(
    Assets.bitcoin.BTC,
    Assets.ethereum.WBTC,
    sendAmount,
    recieveAmount
);
```

The `orderId` is how the backend garden fillers keep track of your orders. If you need to do anything related to your order then you will need the order ID.

Now that the fillers have accepted our swap request, we need to "progress" this request. In the context of swapping BTC to WBTC, it would be depositing in the script address and redeeming our funds from the contract address. To know more about this process, take a look at [core concepts](../core-concepts).

You don't have to actually worry about this process. `GardenJS` abstracts all of this complexity for you as it intelligently figures out what to do on what part of the process. However, you will need to define when this progress happens. This is done using the `.next` method available on the swapper returned by the `.swap` method.

```ts
import { Actions, parseStatus } from "@gardenfi/orderbook";

garden.subscribeOrders(await evmWallet.getAddress(), async (orders) => {
    const order = orders.filter((order) => order.ID === orderId)[0];
    if (!order) return;

    const action = parseStatus(order);

    if (action === Actions.UserCanInitiate || Actions.UserCanRedeem) {
        try {
            const swapper = garden.getSwap(order);
            const swapOutput = await swapper.next();
            console.log(
                `Completed Action ${swapOutput.action} with transaction hash: ${swapOutput.output}`
            );
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            }
        }
    }
});
```

The backend orderbook fillers register transactions based on your evm address. To listen to orders created by your address you will need to subscribe to these orders by passing in your evm address. You should also define a callback that will will take in all update events on the orders.

Inside the callback we filter all orders and only consider the order we've created. This is because orders can also include other order updates which you may have created previously.

We only want to progress on our swap only when we _can_ initiate or redeem. We parse the order status and compare it with the `Actions` enum. If true then we progress the swap using the `next` method on the swapper.

The complete code is available in the [quickstart page](../quickstart).
