---
id: sdk
---

import DocCardList from '@theme/DocCardList';

# SDK
The **Garden SDK** is a set of typescript packages that allow you to bridge Bitcoin to EVM-based chains. It is an abstraction over the Garden APIs, allowing developers to integrate Garden components into their dApps easily.

Want to know how everything works internally? Check out [Core Concepts](./CoreConcepts.md).

## Features
- **Cross-chain Swaps**: Swap assets between Bitcoin and EVM-based chains.
- **Compatibility**: The SDK is compatible with ethers.js or other standard Web3 providers making it easy to integrate with dApps.
- **OTAs**: Create one-time Bitcoin accounts using your Web3 providers, giving you access to all Bitcoin wallet features.

<DocCardList
    items={[
        {
            type: "link",
            href: "./installation",
            label: "Installation",
            docId: "developers/sdk/installation",
        },
        {
            type: "link",
            href: "./quickstart",
            label: "Quickstart",
            docId: "developers/sdk/quickstart",
        },
        {
            type: "link",
            href: "./core-concepts",
            label: "Core Concepts",
            docId: "developers/sdk/core-concepts",
        },
        {
            type: "link",
            href: "./supported-chains",
            label: "Supported Chains",
            docId: "developers/sdk/supported-chains",
        },
        {
            type: "link",
            href: "./api-reference/api-reference",
            label: "API Reference",
            docId: "developers/sdk/api-reference/api-reference",
        },
        {
            type: "link",
            href: "./sdk-guides/sdk-guides",
            label: "SDK Guides",
            docId: "developers/sdk/sdk-guides/sdk-guides",
        },
    ]}
/>