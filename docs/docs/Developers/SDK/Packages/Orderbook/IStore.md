---
sidebar_position: 2
id: istore
---

# IStore

The `IStore` interface defined methods to store and retrieve values from a key value store. The primary purpose of this interface is to be used by the `Orderbook` class to store the auth token.

:::info
`IStore` follows the same interface pattern as `localStorage` in the browser so you can just pass `localStorage` to the `Orderbook` constructor. The `@gardenfi/orderbook` package also provides a `MemoryStorage` implementation that stores that in-memory.
:::

## Methods

```ts
getItem(key: string): string | null
setItem(key: string, value: any): void;
removeItem(key: string): void;
```

## getItem

```ts
getItem(key: string): string | null;
```

Retrieves an item from the store using the provided key.

### Params

-   `key` - The key of the item to retrieve.

### Returns

-   The value of the item or `null` if the item does not exist.

## setItem

```ts
setItem(key: string, value: any): void;
```

Stores an item in the store using the provided key and value.

### Params

-   `key` - The key of the item to store.
-   `value` - The value of the item to store.

## removeItem

```ts
removeItem(key: string): void;
```

Removes an item from the store using the provided key.

### Params

-   `key` - The key of the item to remove.
