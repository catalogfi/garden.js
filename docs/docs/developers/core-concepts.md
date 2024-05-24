---
sidebar_position: 5
id: core-concepts
---

# Core Concepts

# Garden

Bringing Bitcoin to EVM-based chains or vice versa is not a simple process. To accomplish this, Garden utilizes an atomic swap contract. If Alice, a [trader](./../home/actors/Traders.md), wants to swap her bitcoin for an asset on an EVM-based chain or Ethereum itself, she needs a way to communicate with Garden that she wants to swap bitcoin. This is where Garden into play, `Garden` makes use of an orderbook engine to create orders that are matched by actors known as [fillers](./../home/actors/Fillers.md). Alice can now use the garden to make an order to swap her bitcoin to WBTC on Ethereum. We'll cover more details on how this swapping works below.

![create-order](../../static/img/alice_create_order.png)

## Orders

An order is a request to swap assets between two chains. It is created by a trader and matched by a filler. The order is executed using a concept called [atomic-swaps](https://www.catalog.fi/blog/atomic-swaps).

## Order Matching

When you place an order, as previously explained, it gets matched by a filler. In simple terms, a filler is the counterparty in the trade. Fillers play a role as liquidity providers within the Garden ecosystem and are incentivised to match and fulfil orders.

![order-matching](../../static/img/match.png)

## Order Execution

> ❗️ Note:
> This section assumes you have basic knowledge of how atomic swaps work. If you are new to atomic swaps, we recommend you to read [this](https://www.catalog.fi/blog/atomic-swaps) blog post.

Garden uses an `Atomic Swap` smart contract to execute the swap on EVM-based chains. In case of Bitcoin, it generates a `Hash Time Locked Contract (HTLC)` on demand to execute the swap.

### Initiating

Once the order is matched, the trader must complete their part of the trade by sending the assets to the respective contract. For instance, if Alice is exchanging Bitcoin for WBTC on Ethereum, she would transfer her Bitcoin to the Bitcoin HTLC script created by Garden. Conversely, when swapping WBTC for Bitcoin, she would send her WBTC to the official `atomic swap` smart contract. However, it's important to note that the trader generates a secret and uses its hash to lock the funds in the contract. We do not share the secret instead, the funds are secured using the hash of the secret. Only someone with access to the secret can claim the funds.

Meanwhile, the filler monitors the trader's actions and completes their side of the trade using the same secret hash.

Importantly, the secret itself is never revealed until the filler initiates. It remains secure on the client-side. Only the hash of the secret is included in the order request.

![initiate-order](../../static/img/init.png)

### Redeeming

When the order has been initiated by both the trader and the filler, the trader can now redeem the funds. This is accomplished by revealing the secret to the contract. The contract verifies the secret, and if it matches, the funds are released to the trader. The filler utilizes the revealed secret to redeem their side of funds.

![redeem-order](../../static/img/redeem.png)

### Refunding

If the trader fails to redeem the funds, the contract has a refund mechanism. The trader has the option to refund the funds back to their wallet. Similarly, if the trader fails to redeem the funds, the filler refunds back their funds. The refund process operates on a time-based mechanism, allowing funds to be refunded after a specified period. Typically, traders have a refund period of 48 hours, while fillers have a refund period of 24 hours.

![refund-order](../../static/img/refund.png)
