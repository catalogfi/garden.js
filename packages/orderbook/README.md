# @gardenfi/orderbook

The `@gardenfi/orderbook` package manages the orderbook for cross-chain atomic swaps. It provides APIs for creating orders, retrieving order information, managing matched orders, and subscribing to real-time order updates. The package handles order lifecycle management, pagination for large order datasets, and supports filtering orders by various criteria including user address, transaction hash, and order status.

## Installation

```
yarn add @gardenfi/orderbook
```

## Usage

```typescript
import { Orderbook } from '@gardenfi/orderbook';

// Get matched orders for a user
const matchedOrders = await orderbook.getMatchedOrders(userAddress, 'pending', {
  page: 1,
  per_page: 10,
});

// Subscribe to real-time order updates
const unsubscribe = await orderbook.subscribeOrders(
  userAddress,
  true, // matched orders
  5000, // 5 second interval
  async (orders) => {
    console.log('Orders updated:', orders);
  },
);

// Cleanup subscription
setTimeout(() => unsubscribe(), 30000);
```

## Dependencies

- **@gardenfi/utils** - Utility functions for HTTP requests, authentication, and error handling
