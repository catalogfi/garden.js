---
id: quickstart
---

# Quickstart
Garden SDK is a set of packages that aims to quickly and seamlessly swap your cross-chain assets.
## Swapping your BTC to WBTC
Swapping from BTC to WBTC will only require two things from you:
- A Bitcoin private key
- An Ethereum private key

The code snippet below swaps your BTC to WBTC on Ethereum. To understand what's happening at each step, take a look at [Swapping from BTC to WBTC](./sdk-guides/SwappingBtcWbtc.md).

```javascript
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
  const recieveAmount = (1 - 0.3 / 100) * sendAmount;

  const orderId = await garden.swap(
    Assets.bitcoin.BTC,
    Assets.ethereum.WBTC,
    sendAmount,
    recieveAmount
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

- [Creating Wallets](./sdk-guides/CreatingWallets.md): Learn how to create wallets using the @catalogfi/wallets package

- [Swapping from BTC to WBTC](./sdk-guides/SwappingBtcWbtc.md): Swap BTC to WBTC
 
- [Swapping from WBTC to BTC](./sdk-guides/SwappingWbtcBtc.md): Swap WBTC to BTC

- [1inch integration](./sdk-guides/1inchIntegration.md): Integrate 1inch into your app to swap anything to BTC or vice versa


## Learn more about Garden SDK
Learn more about the **Garden SDK** by exploring the supported assets, chains, and underlying concepts.

- [Core Concepts](./CoreConcepts.md): Learn how swapping works under the hood

- [Supported Chains](./SupportedChains.md): Find out all the supported chains & assets supported by Garden SDK
