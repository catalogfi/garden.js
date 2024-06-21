---
id: core
---

# Core
# GardenJS
The `GardenJS` class simplifies the creation of atomic swap orders and interactions with it.

## Creating a `GardenJS` Instance
```ts
constructor(orderbook: IOrderbook, wallets: Partial<Wallets>)
```

It accepts an `IOrderbook`, and an object with the keys as the `Chain` and the corresponding wallet for that chain. It can be created as follows:
```ts
import { 
    BitcoinOTA, 
    EVMWallet,
    BitcoinNetwork,
    BitcoinProvider,
} from "@catalogfi/wallets";
import { Orderbook, Chains } from "@gardenfi/orderbook";
import { GardenJS } from "@gardenfi/core";
import { BrowserProvider } from "ethers";

const bitcoinProvider = new BitcoinProvider(BitcoinNetwork.Testnet);
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const bitcoinWallet = new BitcoinOTA(bitcoinProvider, signer);
const ethereumWallet = new EVMWallet(signer);

const orderbook = await Orderbook.init({
	signer,
	opts: {
		domain: window.location.host
	}
});

const garden = new GardenJS(orderbook, {
	"ethereum_sepolia": ethereumWallet,
	"bitcoin_testnet": bitcoinWallet
});
```

### Methods
```ts
subscribeOrders(address: string, callback: (orders: Orders) => void): void

unsubscribeOrders(): void

swap(
	from: Asset,
	to: Asset,
	amt: number,
	receiveAmount: number,
	opts?: { btcInputAddress?: string }
): Promise<number>

getSwap(order: Order): ISwapper

calculateReceiveAmt(
	from: Asset,
	to: Asset,
	sendAmt: number
): Promise<number>
```

## Subscribe Orders
```ts
subscribeOrders(address: string, callback: (orders: Orders) => void): void
```

The `subscribeOrders` method is a wrapper over `IOrderbook`'s `subscribeOrders`. This method allows you to listen to all order updates where you're the maker or the taker.

### Parameters
- `address`: The address whose orders you want to listen to
- `callback`: a callback function that takes in `Orders` as a parameter.

## Unsubscribe Orders
```ts
unsubscribeOrders(): void
```
The `unsubscribeOrders` method stops listening to all orders on all accounts.

## Swap
```ts
swap(
    from: Asset,
    to: Asset,
    amt: number,
    receiveAmount: number,
    opts?: { btcInputAddress?: string }
): Promise<number>
```

The swap method is used to create atomic swap orders. The initiator addresses and receiver addresses are filled based on the wallets provided. For example, if your `fromAsset` is testnet Bitcoin then the address chosen as the initiator address is the testnet Bitcoin wallet.

The secret is the message signed by an `IBitcoinWallet` and the signed message is `garden.js<nonce><EVM wallet's pub key>` where the nonce is the number of orders created plus one (without the angular brackets).
```ts
//after creating a GardenJS instance

import { Assets } from '@gardenfi/orderbook';

const orderId = await garden.swap(
    Assets.bitcoin_testnet.BTC, 
    Assets.ethereum_sepolia.WBTC, 
    sendAmount, 
    receiveAmount
);
```

### Parameters
- `from`: The asset that you want to swap from
- `to`: The asset you want to receive
- `amt`: The amount that you're sending. Note that this number must be in the lowest denomination of that asset. For example, if you're swapping 1 Bitcoin then the amount must be `100,000,000` SATS
- `receiveAmount`: The amount of the to Asset that you want to receive. Like the send amount, this amount, too, should be in its lowest denomination.
- `opts.btcInputAddress`: The address in which you want to receive your Bitcoin.

### Returns
The order id.

### Get Swap
```ts
getSwap(order: Order): ISwapper
```

The `getSwap` method provides a `Swapper` instance that allows you to initiate, redeem, or refund your order by using the `.next()` method. The `.next()` method makes the appropriate action based on the status of the order and the role of the person performing the action that is, initiator or redeemer.

The `status` of an order is 3 digit number where:
- the first digit indicates the overall order status, found in `Order.status`
- the second digit indicates the order status of the initiator atomic swap, found in `Order.initiatorAtomicSwap.swapStatus`
- the third digit indicates the order status of the follower (redeemer) atomic swap, found in `Order.followerAtomicSwap.swapStatus`.

The `parseStatus` function in `@gardenfi/orderbook` provides you the `status` of an order based on an `Order`. Following are the relevant statuses that you must know to perform the relevant actions:

- `200`: Order filled, initiator can initiate.
- `220`: The initiator has initiated it, and the follower can initiate it.
- `222`: The follower has initiated it, and the initiator can now redeem it.
- `224`: The initiator has redeemed their funds, and the follower can also redeem their funds.
- `x3x`: The order expired, so the initiator is eligible to redeem their funds. x indicates any number.
- `xx3`: The order expired, so the follower is eligible to redeem their funds. x indicates any number.

When creating orders, the follower is the backend orderbook fillers.

### Calculate Receive Amount
```ts
calculateReceiveAmt(from: Asset, to: Asset, sendAmt: number): Promise<number>
```

Calculates the optimal amount of fee taken by the fillers in the orderbook which is *currently 3%*.

### Parameters
- `from`: The asset that you want to swap from
- `to`: The asset that you want to swap to
- `sendAmt`: The amount that you're sending in the lowest denomination of the asset that you're swapping from.

### Returns
The amount that you will receive in the lowest denomination of the asset that you're swapping.
