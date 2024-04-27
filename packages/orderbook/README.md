## @gardenfi/orderbook

The `@gardenfi/orderbook` package is used to facilitate the creation of orders. It also provides functionality for listening to orders and retrieving orders created by a specific address.

### Installation

```
npm install @gardenfi/orderbook
```

### Usage

1. Creating an order: ([should create an order with the valid configuration](https://github.com/catalogfi/garden.js/blob/4623a0679d1948755500c7179113112a025e33f8/packages/orderbook/src/lib/orderbook.spec.ts#L61  ))
2. Getting all orders created by an address: ([should return orders where the user is the maker](https://github.com/catalogfi/garden.js/blob/4623a0679d1948755500c7179113112a025e33f8/packages/orderbook/src/lib/orderbook.spec.ts#L79))
3. Listening to orders: ([should update when order is created](https://github.com/catalogfi/garden.js/blob/4623a0679d1948755500c7179113112a025e33f8/packages/orderbook/src/lib/orderbook.spec.ts#L94))

### Setup

Both CommonJs and ES imports are supported so there is not extra setup needed to use the library. To use the orderbook simply import it (using import or require statements) and perform your logic. Make sure to use a signer if you're using the library in an environment where you do not have access to the private keys.
