---
id: orderbook
---

# Orderbook

The `@gardenfi/orderbook` package is used to facilitate the creation of orders. It provides functionality for creating orders, listening to a specific order, and retrieving all orders created by a specific address.

## Creating the Orderbook

:::note
We recommend using `ethers@6.8.0` for the comatibility with the `@gardenfi/orderbook` package.
:::

The `Orderbook` instance can be created using the constructor or the `.init(..)` static method. It is recommended to use the `.init(..)` static method to create the orderbook as it also performs authentication during orderbook creation.

```ts
import { Orderbook, MemoryStorage } from "@gardenfi/orderbook";
import { Wallet } from "ethers";

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const orderbook = await Orderbook.init({
  url: "https://api.garden.finance",
  signer,
  opts: {
    domain: window.location.host,
    store: localStorage,
  },
});
```

### Parameters

- `OrderbookConfig`: The configuration object for the orderbook.
- `url`: The backend API URL the orderbook uses, to create or listen to orders. (Optional)
- `signer`: The signer that is used to authenticate the user.
- `opts`: Additional options that customize authentication behavior. (Optional)
- `domain`: The domain from which the authentication request originates. This is usually the URL of the dApp in which you're using the orderbook. In case `Orderbook` is being used in the backend, then this field can be left empty. (Optional)
- `store`: Storage for the auth token. If left empty, then in-memory storage is used. (Optional)

### Methods

```ts
init(orderbookConfig: OrderbookConfig)

createOrder(createOrderConfig: CreateOrderConfig): Promise<number>

getOrders<T extends boolean>(address: string, orderConfig?: Partial<OrderConfig<T>>): Promise<(T extends true ? Order : OrderNonVerbose[]>

subscribeOrders(account: string, cb: (orders: Order[]) => void): void

unsubscribeOrders(): void
```

## Create Order

```ts
createOrder(createOrderConfig: CreateOrderConfig): Promise<number>
```

Creates an order.

```ts
import { Assets } from "@gardenfi/orderbook";
import { sha256 } from "ethers";
import * as crypto from "crypto";

//make sure the initialise the orderbook and your wallet

const sendAmount = 0.001 * 1e8;
const receiveAmount = sendAmount - 0.03 * sendAmount; //taking 0.3% as fee
const sendAddress = "<YOUR BITCOIN ADDRESS>";
const secret = crypto.randomBytes(32).toString("hex");
const secretHash = sha256(secret);

const orderId = await orderbook.createOrder({
  fromAsset: Assets.bitcoin_testnet.BTC,
  toAsset: Assets.ethereum_sepolia.WBTC,
  sendAddress,
  receiveAddress: await wallet.getAddress(),
  sendAmount: sendAmount.toString(),
  receiveAmount: receiveAmount.toString(),
  secretHash,
  btcInputAddresss,
});
```

### Parameters

- `CreateOrderConfig` - The configuration for creating the order.
- `fromAsset`: The asset you're swapping from. In the above example since you're swapping from bitcoin testnet, so `Assets.bitcoin_testnet.BTC` is used.
- `toAsset`: The type of asset in which you want to receive your funds. In the above example, it is WBTC on Sepolia.
- `sendAddress`: The address from which you want to send `fromAsset`.
- `receiveAddress`: The address at which you want to receive the `toAsset`.
- `sendAmount`: The amount of `fromAsset` you want to send.
- `receiveAmount`: The amount of `toAsset` you want to receive.
- `secretHash`: `sha256` hash of the secret. The secret has to be a unique 32-byte length string.
- `btcInputAddress`: If specified then the funds will be sent to this address.

#### Returns

Order ID of the created order.
:::note
The `sendAmount` and `receiveAmount` must be in their lowest denominations. For example, if you want to send `0.001` Bitcoin then the `sendAmount` would be `100,000` SATS.
:::

### Get Orders

```ts
getOrders<T extends boolean>(
    address: string,
    orderConfig?: Partial<OrderConfig<T>>
): Promise<(T extends true ? Order : OrderNonVerbose)[]>
```

To get all orders of an address, you can use `.getOrders()` to get a list of all the orders.

```ts
const orders = await orderbook.getOrders("<AN EVM ADDRESS>", {
  verbose: true,
  taker: false, //get only those orders where the specified address acted as the initiator
});
```

### Parameters

- `address`: The EVM address for which you want to view orders.
- `orderConfig`: Config to customise the type of returned orders.
- `orderConfig.verbose`: Populates the `initiatorAtomicSwap` and `followerAtomicSwap` fields in the returned orders if set to true. This field is set to false by default.
- `orderConfig.maker`: If set to true then only the orders made from the specified address will be returned, else the method will return only those orders where the specified address acted as a receiver.

#### Returns

An array of orders. If verbose is specified, the order will also include details of the initiator and follower atomic swaps.

### Subscribe Orders

```ts
subscribeOrders(account: string, cb: (orders: Order[]) => void): void
```

If you want to listen to any updates on an order associated with a given EVM address, then you can use `.subscribeOrders()`.

```ts
const orderId = 156; //the order you want to listen to

orderbook.subsribeOrders("<AN EVM ADDRESS>", (orders) => {
  const filteredOrder = orders.filter((order) => order.ID === orderId);
  //perform your logic with the order
});
```

### Parameters

- `account`: The address for which you want to receive order updates.
- `cb`: A callback that accepts orders as a parameter.

:::note
The initial response from a socket provides all orders linked to a specified address, irrespective of whether they have been updated or not.
:::

### Unsubscribe Orders

`unsubscribeOrders(): void`

Used to stop listening to order updates.
