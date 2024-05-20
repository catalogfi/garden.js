---
sidebar_position: 3
id: initiating-and-redeeming
---

# Initiating and Redeeming an order

For easy interaction with the backend interfaces we recommend using the GardenJS class available in `@gardenfi/core` as it allows you to create orders and interact with them.

As usual, we need to have an initial setup before using GardenJS.

<!-- prettier-ignore -->
```ts
import { JsonRpcProvider, Wallet } from 'ethers';
import { Orderbook, Chains, parseStatus } from '@gardenfi/orderbook';
import { 
    BitcoinNetwork, 
    BitcoinProvider, 
    BitcoinWallet, 
    EVMWallet, 
    generateMnemonic, 
    mnemonicToPrivateKey 
} from '@catalogfi/wallets';
import { GardenJS } from '@gardenfi/core';

const mnemonic = generateMnemonic();

//setting up the EVM wallet
const wallet = Wallet.fromPhrase(
    mnemonic, 
    new JsonRpcProvider('https://rpc.ankr.com/eth_sepolia')
);
const ethereumWallet = new EVMWallet(signer);

//setting up the Bitcoin wallet
const signer = new Wallet(wallet.privateKey, wallet.provider);
const network = BitcoinNetwork.Testnet;
const pk = mnemonicToPrivateKey(mnemonic, network);
const bitcoinProvider = new BitcoinProvider(network);
const bitcoinWallet = BitcoinWallet.fromPrivateKey(pk, bitcoinProvider);

//creating the orderbook
const orderbook = await Orderbook.init({
    signer,
});
```

Now that we have the setup ready, creating an instance of GardenJS is pretty simple.

<!-- prettier-ignore -->
```ts
const garden = new GardenJS(orderbook, {
    [Chains.bitcoin_testnet]: bitcoinWallet,
    [Chains.ethereum_sepolia]: ethereumWallet,
});
```

Creating an order is simply specifying the assets you want to swap along with their amounts.

:::note
If you create an order with an asset from a different chain, your order will not go through.
:::

<!-- prettier-ignore -->
```ts
const orderId = await garden.swap(
    Assets.bitcoin_testnet.BTC, 
    Assets.ethereum_sepolia.WBTC, 
    100000, 
    95000
);
```

Now that you have an order id, you can subscribe to updates over an EVM address. This will return all the updated orders.

<!-- prettier-ignore -->
```ts
garden.subscribeOrders(await signer.getAddress(), async (orders) => {
    const order = orders.filter((order) => order.ID === orderId)[0];
    if (!order) return;

    const action = parseStatus(order);

    //this means that if an order is ready to be initated or redeemed, we can go ahead with that action
    if (action === Actions.UserCanInitiate || action === Actions.UserCanRedeem) {
        const swapper = garden.getSwapper(order);
        const swapOutput = await swapper.next();

        console.log(`Swapper action: ${swapOutput.action} with tx hash: ${swapOutput.output}`);
    }
});
```
