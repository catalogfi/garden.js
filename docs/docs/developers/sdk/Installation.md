---
id: installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import InstallAlert from "./\_install-alert.mdx";

# Installation

<InstallAlert/>

To install the `Garden SDK`, You can use the following options:
<Tabs>
<TabItem value="npm" label="npm" default>

```shell
npm install @catalogfi/wallets @gardenfi/orderbook @gardenfi/core
```

</TabItem>
<TabItem value="yarn" label="yarn">
```shell
yarn add @catalogfi/wallets @gardenfi/orderbook @gardenfi/core
```
</TabItem>
<TabItem value="pnpm" label="pnpm">
```shell
pnpm add @catalogfi/wallets @gardenfi/orderbook @gardenfi/core
```
</TabItem>
<TabItem value="bun" label="bun">
```shell
bun add @catalogfi/wallets @gardenfi/orderbook @gardenfi/core
```
</TabItem>
</Tabs>

If you are using ethers alongside the Garden SDK, we recommend using `ethers@6.8.0` for compatibility.
