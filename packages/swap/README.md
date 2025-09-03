# @gardenfi/swap

A lightweight, ready-to-use `<Garden />` component that wires up `GardenProvider` and exposes `useGarden` for consuming apps. Designed to drop into any React app and get all Garden features via the provider and hooks.

## Install

```bash
yarn add @gardenfi/swap
```

## Usage

```tsx
import React from 'react';
import { Garden, useGarden } from '@gardenfi/swap';

export default function App() {
  const config = {
    environment: 'mainnet',
    // wallets or htlc configs here
  } as any;

  return (
    <Garden config={config}>
      <MySwapUI />
    </Garden>
  );
}

function MySwapUI() {
  const { getQuote, swapAndInitiate, pendingOrders } = useGarden();
  // ...
  return null;
}
```

## Scripts

- `yarn build`
- `yarn dev` (watch build)
- `yarn link`

## Local linking

From repo root:

```bash
yarn link:all
```

To unlink:

```bash
yarn unlink:all
```

## Publishing

This package follows the root workspace publish scripts. Use:

```bash
yarn publish:affected
# or for beta
yarn publish:affected:beta
```
