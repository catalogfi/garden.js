---
sidebar_position: 2
id: creating-orders
---

# Creating an order

In the Garden ecosystem, an order is a request given by the user to create an atomic swap. Once the order is "filled" (`order.status` = 1), the user can initiate the order.
After initiation, the fillers initiate their part of the atomic swap after which users can redeem their funds.

Orders can be created in two ways:

-   using the `@gardenfi/orderbook` package
-   using the `@gardenfi/core` package

## Using the `@gardenfi/orderbook` package

The `@gardenfi/orderbook` package is used to facilitate the creation of orders. It also provides functionality for listening to orders and retrieving orders created by a specific address. Once an orderbook instance is created, `.createOrder` method can be used to create an order. A signer is required to authenticate with the authenticator system.

<!-- prettier-ignore -->
```ts
import { Wallet, JsJsonRpcProvideron } from 'ethers';
import { Orderbook, Assets } from '@gardenfi/orderbook';
import { generateMnemonic } from "@catalogfi/wallets";
import * as crypto from "crypto";

const mnemonic = generateMnemonic();
const wallet = Wallet.fromPhrase(
    mnemonic,
    new JsonRpcProvider('https://rpc.ankr.com/eth_sepolia')
);
const signer = new Wallet(wallet.privateKey, wallet.provider);

(async() => {
    const secret = crypto.randomBytes(32).toString('hex');
    const orderbook = await Orderbook.init({ signer });
    const orderId = await orderbook.createOrder({
        fromAsset: Assets.ethereum_sepolia.WBTC,
        toAsset: Assets.bitcoin_testnet.BTC,
        sendAddress: await signer.getAddress(),
        receiveAddress: 'myiNNPrvgrsBdvVZ6dVhqZhrbAFg7aVYmx',
        sendAmount: '100000',
        receiveAmount: '95000',
        secretHash: sha256(Buffer.from(secret, 'hex')),
        btcInputAddress: 'myiNNPrvgrsBdvVZ6dVhqZhrbAFg7aVYmx', /** If this field is provided then BTC will be sent to this address */
    });

    console.log(`Order with id ${orderId} created`);
})();
```

:::note
If you're in an environment where you do not have access to your private keys, such as in a dApp, then you should pass in a JsonRpcSigner instead to the orderbook.
:::

## Using the `@gardenfi/core` package

While the `@gardenfi/orderbook` package only creates orders, the `@gardenfi/core` package also provides functionality for initiating, redeeming and refunding an order. This can be done through a swapper which is returned with the `.getSwap(order)` method in `CataloJS`. The `.next()` method on the `Swapper` will initiate, redeem, refund the swap accordingly based on the order status. If no action can be performed on the other status then it simply returns an object indicating so.

First, we'll setup the wallets to be used by `GardenJS`.

<!-- prettier-ignore -->
```ts
import { JsonRpcProvider, Wallet } from "ethers";
import { Orderbook, Chains } from "@gardenfi/orderbook";
import {
    BitcoinNetwork,
    BitcoinProvider,
    BitcoinWallet,
    EVMWallet,
    generateMnemonic,
    mnemonicToPrivateKey,
} from "@catalogfi/wallets";
import { GardenJS } from "@gardenfi/core";

const mnemonic = generateMnemonic();
const wallet = Wallet.fromPhrase(
    mnemonic,
    new JsonRpcProvider("https://rpc.ankr.com/eth_sepolia")
);
const signer = new Wallet(wallet.privateKey, wallet.provider);

const network = BitcoinNetwork.Testnet;
const pk = mnemonicToPrivateKey(mnemonic, network);
const bitcoinProvider = new BitcoinProvider(network);
const bitcoinWallet = BitcoinWallet.fromPrivateKey(pk, bitcoinProvider);

const ethereumWallet = new EVMWallet(signer);
```

Now, after creating the orderbook we pass the wallets and the orderbook to `GardenJS`.

<!-- prettier-ignore -->
```ts
(async () => {
    const orderbook = await Orderbook.init({
        signer,
    });

    const garden = new GardenJS(orderbook, {
        [Chains.bitcoin_testnet]: bitcoinWallet,
        [Chains.ethereum_sepolia]: ethereumWallet,
    });

    const orderId = await garden.swap(
        Assets.bitcoin_testnet.BTC, 
        Assets.ethereum_sepolia.WBTC, 
        100000, 
        95000
    );

    console.log(`Order with id ${orderId} created`);
})();
```

Just like the orderbook, `GardenJS` also provides functionality for listening to orders. Interacting with orders using `.getSwap()` is shown below.

<!-- prettier-ignore -->
```ts
//consider this to be under the same IIFE as the above code snippet.
(async () => {
    garden.subscribeOrders(await signer.getAddress(), async (orders) => {
        const order = orders.filter((order) => order.ID === orderId)[0];
        if (!order) return;

        const swapper = garden.getSwap(order);
        const swapOutput = await swapper.next();
        if (swapOutput.action === SwapperActions.None) return;

        console.log(
            `Swapper action: ${swapOutput.action} with tx id: ${swapOutput.output}`
        );
    });
})();
```

:::note
If you use the `.next()` method at the wrong order status then no action will be performed. When this happens we simply return.
:::
