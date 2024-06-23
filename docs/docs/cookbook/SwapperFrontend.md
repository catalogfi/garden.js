---
id: swapper-frontend
---

# Swapper Frontend

:::note
Checkout full example [here](https://github.com/gardenfi/swapper-frontend).
:::

## Introduction

This guide explains how one can use Garden SDK to build a simple dapp that can swap WBTC to BTC.

:::warning
This guide should not be used as it is in the production. This is just an example to get you started with SDK in the frontend.
:::

## Project Setup

Let's create a react app using the following command. If you don't have bun installed, please refer [bun](https://bun.sh/).

```shell
bun create vite swapper --template react-swc-ts
```

## Installing Dependencies

Following are the necessary dependencies needed for building the dapp.

```shell
bun add @gardenfi/core @gardenfi/orderbook ethers@6.8.0
```

## Installing dev dependencies

We need `vite-plugin-wasm` and `vite-plugin-node-polyfills` dependencies to work with the SDK in the frontend.

```shell
bun add -D vite-plugin-wasm vite-plugin-node-polyfills vite-plugin-top-level-await
```

Let's update the vite config to the following.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), nodePolyfills(), topLevelAwait()],
});
```

Now we are all set to build the dapp.

## The Dapp

The docs mention a lot about creating a `Garden` instance and using it to create swaps and perform actions on it. Let's create a hook which encapsulates the creation of garden instance.
We use `zustand` to maintain store in the dapp as it requires less boilerplate and easy to use. Please refer [zustand](https://github.com/pmndrs/zustand) if you feel uncomfortable with following code.

### useGarden hook

```ts
import { GardenJS } from "@gardenfi/core";
import { create } from "zustand";

type GardenStore = {
  garden: GardenJS | null;
  setGarden: (garden: GardenJS) => void;
};

const gardenStore = create<GardenStore>((set) => ({
  garden: null,
  setGarden: (garden: GardenJS) => {
    set(() => ({
      garden,
    }));
  },
}));

const useGarden = () => gardenStore((state) => state.garden);
```

`useGarden` is a simple hook which returns garden Instance.
Now let's create a hook which sets the garden in the store.

```ts
// this hook has to be called at the root level only once
const useGardenSetup = () => {
// this could be useWeb3React too. (type of browserProvider from ethers)
  const evmProvider = useMetaMaskStore((state) => state.evmProvider);

  const setGarden = gardenStore((state) => state.setGarden);

  useEffect(() => {
    (async () => {
      if (!evmProvider) return;
      const signer = await evmProvider.getSigner();
      const bitcoinProvider = new BitcoinProvider(BitcoinNetwork.Testnet);

      const orderbook = await Orderbook.init({
        url: "https://stg-test-orderbook.onrender.com/",
        signer: signer,
        opts: {
          domain: (window as any).location.host,
          store: localStorage,
        },
      });

      const wallets = {
        [Chains.bitcoin_testnet]: new BitcoinOTA(bitcoinProvider, signer),
        [Chains.ethereum_sepolia]: new EVMWallet(signer),
      };

      const garden = new GardenJS(orderbook, wallets);

      setGarden(garden);
    })();
  }, [evmProvider]);
```

`useGardenSetup` will set the garden provider whenever the evm provider changes. More on creation of wallets here [Creating Wallets](../developers/sdk/sdk-guides/CreatingWallets.md).
Orderbook needs a signer to authenticate the user and optionally url, domain and store(used for caching auth tokens). The url being used here is a test orderbook url. Remove the url if you want to use the production orderbook.

## Root component

```ts
import SwapComponent from "./SwapComponent";
import TransactionsComponent from "./TransactionComponent";
import "./App.css";

function App() {
  return (
    <div id="container">
      <SwapComponent></SwapComponent>
      <TransactionsComponent></TransactionsComponent>
    </div>
  );
}

export default App;
```

We did not use tailwindcss or any other css library and css for the app is out of scope of this guide, but you can find all the code in the github [here](https://github.com/gardenfi/swapper-frontend).

Here `SwapComponent` contains code for swap screen and `TransactionsComponent` contains code for getting latest transactions of the current active EVM account.

## Swap Component

```ts
const SwapComponent: React.FC = () => {
  useGardenSetup();
  const [amount, setAmount] = useState<AmountState>({
    btcAmount: null,
    wbtcAmount: null,
  });

  const changeAmount = (of: "WBTC" | "BTC", value: string) => {
    if (of === "WBTC") {
      handleWBTCChange(value);
    }
  };
  const handleWBTCChange = (value: string) => {
    let newAmount: AmountState = { wbtcAmount: value, btcAmount: null };
    if (Number(value) > 0) {
      const btcAmount = (1 - 0.3 / 100) * Number(value);
      newAmount.btcAmount = btcAmount.toString();
    }
    setAmount(newAmount);
  };

  return (
    <div className="swap-component">
      <WalletConnect />
      <hr></hr>
      <SwapAmount amount={amount} changeAmount={changeAmount} />
      <hr></hr>
      <Swap amount={amount} changeAmount={changeAmount} />
    </div>
  );
};
```

It is a basic component which calls the `useGardenSetup` , which sets the `Garden` instance.
`WalletConnect` has the logic for connecting to metamask.
`SwapAmount` has the logic for taking the input amounts.
`Swap` has the logic for taking addresses and actual swapping logic. Let's take a look at this component.

```ts
import { Assets } from "@gardenfi/orderbook";

type SwapProps = {
  amount: AmountState;
  changeAmount: (of: "WBTC" | "BTC", value: string) => void;
};

const Swap: React.FC<SwapProps> = ({ amount, changeAmount }) => {
  const garden = useGarden();
  const [btcAddress, setBtcAddress] = useState<string>();
  const { metaMaskIsConnected } = useMetaMaskStore();
  const { wbtcAmount, btcAmount } = amount;

  const handleSwap = async () => {
    if (
      !garden ||
      typeof Number(wbtcAmount) !== "number" ||
      typeof Number(btcAmount) !== "number"
    )
      return;
    // convert to least denominations.
    const sendAmount = Number(wbtcAmount) * 1e8;
    const recieveAmount = Number(btcAmount) * 1e8;

    setBtcAddress("");
    changeAmount("WBTC", "");

    await garden.swap(
      Assets.ethereum_sepolia.WBTC,
      Assets.bitcoin_testnet.BTC,
      sendAmount,
      recieveAmount
    );
  };

  return (
    <div className="swap-component-bottom-section">
      <div>
        <label htmlFor="receive-address">Receive address</label>
        <div className="input-component">
          <input
            id="receive-address"
            placeholder="Enter BTC Address"
            value={btcAddress ? btcAddress : ""}
            onChange={(e) => setBtcAddress(e.target.value)}
          />
        </div>
      </div>
      <button
        className={`button-${metaMaskIsConnected ? "white" : "black"}`}
        onClick={handleSwap}
        disabled={!metaMaskIsConnected}
      >
        Swap
      </button>
    </div>
  );
};
```

The main logic we want to look at is `handleSwap` . `garden.swap` creates the swap given the assets and amounts. It is as simple as that.

## Transactions Component

We will not discuss the whole component here, but let's look at how we fetch the orders aka transactions.

```ts
function TransactionsComponent() {
  const garden = useGarden();
  const { evmProvider } = useMetaMaskStore();
  const [orders, setOrders] = useState(new Map<number, OrderbookOrder>());

  useEffect(() => {
    const fetchOrders = async () => {
      if (!garden || !evmProvider) return;

      const signer = await evmProvider.getSigner();
      const evmAddress = await signer.getAddress();

      if (!evmAddress) return;

      garden.subscribeOrders(evmAddress, (updatedOrders) => {
        setOrders((prevOrders) => {
          const updatedOrdersMap = new Map(prevOrders);
          updatedOrders.forEach((order) =>
            updatedOrdersMap.set(order.ID, order)
          );
          return updatedOrdersMap;
        });
      });
    };

    fetchOrders();
  }, [garden, evmProvider]);

  const recentOrders = Array.from(orders.values())
    .sort((a, b) => b.ID - a.ID)
    .slice(0, 3);

  if (!recentOrders.length) return null;

  return (
    <div className="transaction-component">
      {recentOrders.map((order) => (
        <OrderComponent order={order} key={order.ID} />
      ))}
    </div>
  );
}
```

`garden.subscribeOrders` will create a socket connection with the orderbook backend and fetches all orders on first request and updated orders on subsequent requests. Now performing actions on orders is as follows.

```ts
const swapper = garden.getSwap(order);
const performedAction = await swapper.next();
```

`swapper.next()` performs required actions to go into next state. If you created an order just now, `.next()` will initiate the order by depositing funds. Once the counterparty initiates, calling `.next` redeems the funds on destination chain. But when to do what ? You can parse the status of the order using the below code snippet.

```ts
import { Actions, parseStatus } from "@gardenfi/orderbook";
const parsedStatus = parseStatus(order);
// parsedStatus could be one of these (UserCanInitiate, UserCanRedeem, UserCanRefund)
```

Checkout full code [here](https://github.com/gardenfi/swapper-frontend).

## Conclusion

As we discussed earlier, this is just a basic example to get you started with the SDK in the frontend. A lot of UI components is not explained here as we are focusing on the SDK part only.
