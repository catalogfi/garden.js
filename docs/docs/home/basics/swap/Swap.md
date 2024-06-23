---
id: swap
---

import DocCardList from '@theme/DocCardList';

# Swap
Most of the existing bridges are built on custodian networks, AMM liquidity pools, or a combination of both. As a result, swap durations fluctuate vastly, ranging from 30 minutes to ~24 hours contingent on the amount being converted and the time taken by custodian networks for wrapping/unwrapping (tends to be between 3-5 hours). While some solutions offer “time-optimized” choices, they can result in extreme slippage (ranging from 4-40% for a 1-20 BTC trade). Coming to security, these systems range from centralised to semi-decentralised at best, a major cause behind all the infamous bridge hacks.

Garden is unlike traditional 'bridges' and doesn't have a custodian network or multi-sig securing the bridge. It is built using a decentralised [Order Matching Engine](./OrderMatchingEngine.md) and peer-to-peer [Atomic Swaps](./AtomicSwaps.md). As a result, Garden's security and decentralization are deferred to the chains on which it is deployed, making it less vulnerable to attacks. 

In the context of Garden and its capabilities, when we discuss "swaps," we are referring specifically to the process of exchanging Bitcoin (BTC) for Wrapped Bitcoin (WBTC) and vice versa. These swaps facilitate the movement of value between two different blockchains, with BTC residing on its native blockchain and WBTC typically being an ERC-20 token on the Ethereum or Arbitrum blockchains.

However, Garden enhances this basic functionality by supporting swaps on potentially any L1 or L2 blockchain that can integrate with the Garden [SDK](../../../developers/sdk/Sdk.md).

## Types of swaps in the garden:
### 1. BTC to WBTC Swap
- **Direction**: Bitcoin (BTC) to Wrapped Bitcoin (WBTC) on the Ethereum/Arbitrum blockchain.
- **Purpose**: Allows Bitcoin holders to participate in Ethereum/Arbitrum-based DeFi activities by converting BTC into WBTC, a token representing Bitcoin on the Ethereum/Arbitrum blockchain with a 1:1 backing.
- **Speed**: Under 10 minutes.
### 2. WBTC to BTC Swap
- **Direction**: Wrapped Bitcoin (WBTC) back to Bitcoin (BTC).
- **Purpose**: Enables users to convert their WBTC back into native BTC, typically for withdrawal to a personal wallet or use in Bitcoin-only applications.
- **Speed**: Under 5 minutes.
### 3. WBTC to WBTC Swap
- **Direction**: Wrapped Bitcoin (WBTC) to Wrapped Bitcoin (WBTC) on the Ethereum/Arbitrum/Polygon/Optimism blockchain.
- **Purpose**: Allows WBTC holders to move the WBTC from one blockchain to another.
- **Speed**: Under 5 minutes.

If you are performing the swap for the first time and looking for a step-by-step guide, please use the [Guides](../guides/Guides.md). 

Garden's significant advantage is its ability to perform these swaps quickly and across different blockchains. This broad compatibility aims to enable seamless and secure Bitcoin support for various decentralized applications (dApps), expanding Bitcoin's utility and accessibility within the broader blockchain ecosystem.

<DocCardList
    items={[
        {
            type: "link",
            href: "./atomic-swaps",
            label: "Atomic Swaps",
            docId: "home/basics/swap/atomic-swaps",
        },
        {
            type: "link",
            href: "./order-matching-engine",
            label: "Order Matching Engine",
            docId: "home/basics/swap/order-matching-engine",
        }
    ]}
/>