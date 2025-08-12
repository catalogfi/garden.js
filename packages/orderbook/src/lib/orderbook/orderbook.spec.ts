// import { sepolia } from 'viem/chains';
// import { privateKeyToAccount } from 'viem/accounts';
// import { createWalletClient, http, sha256 } from 'viem';
// import { randomBytes } from 'crypto';
import {
  describe,
  expect,
  expectTypeOf,
  test,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  //  Siwe, sleep,
  // with0x,
  Url,
  Request as UtilsRequest,
} from '@gardenfi/utils';
import { Orderbook } from './orderbook';
import {
  // CreateOrderConfig,
  // CreateOrderRequestWithAdditionalData,
  MatchedOrder,
} from './orderbook.types';
// import { Asset, Chains } from '../asset';

describe.only('orders provider', async () => {
  const orderbookApi = 'https://testnet.api.garden.finance/orders';
  const address = '0xE1CA48fcaFBD42Da402352b645A9855E33C716BE';
  const id = '1d93c7cccbbb5bea0b1f8072e357185780efb5dcbf74e4d8f675219778e1a8b9';

  const orderbook = new Orderbook(new Url(orderbookApi));

  test.skip('should get order', async () => {
    const order = await orderbook.getOrder(id, true);
    console.log('order.val :', order.val);
    expect(order.error).toBeUndefined();
    expect(order.val?.create_order.create_id).toEqual(id);
    if (order.val) {
      expectTypeOf(order.val).toEqualTypeOf<MatchedOrder>();
    }
  });

  test.skip('should get pending orders of a address', async () => {
    const orders = await orderbook.getMatchedOrders(address, 'pending');
    expect(orders.error).toBeUndefined();
    expect(orders.val?.data.length).toBeGreaterThan(0);
    if (orders.val?.data) {
      expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
    }
  });

  test('should get all orders', async () => {
    const orders = await orderbook.getOrders(true, {});
    expect(orders.error).toBeUndefined();
    expect(orders.val?.data.length).toBeGreaterThan(0);
    if (orders.val?.data) {
      expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
    }
  });

  test.skip('should subscribe to orders', async () => {
    const unsubscribe = await orderbook.subscribeOrders(
      address,
      true,
      1000,
      async (orders) => {
        expect(orders.data.length).toBeGreaterThan(0);
        expectTypeOf(orders.data).toEqualTypeOf<MatchedOrder[]>();
      },
    );
    expectTypeOf(unsubscribe).toEqualTypeOf<() => void>();
  }, 10000);

  test.only('should get orders with options', async () => {
    const orderResponse = await orderbook.getOrders(
      true,
      {
        address: '0x41154d8D32dA87A7c565e964CD191243B728EDF7',
        fromChain: 'bitcoin_testnet',
        status: 'in-progress',
        toChain: undefined,
        tx_hash: undefined,
      },
      undefined,
    );
    expect(orderResponse.ok).toBeTruthy();
    const orders = orderResponse.val!.data;
    console.log('orders :', orders[0]);
  });

  test.skip('order count', async () => {
    const count = await orderbook.getOrdersCount(address);
    expect(count.error).toBeUndefined();
    expect(count.val).toBe(0);
  }, 10000);
}, 950000);

describe('AbortController functionality', () => {
  const orderbookApi = 'https://testnet.api.garden.finance/orders';
  const orderbook = new Orderbook(new Url(orderbookApi));
  const address = '0xE1CA48fcaFBD42Da402352b645A9855E33C716BE';
  const id = '1d93c7cccbbb5bea0b1f8072e357185780efb5dcbf74e4d8f675219778e1a8b9';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.skip('should accept AbortController in getOrder request', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
    };

    const order = await orderbook.getOrder(id, true, request);
    expect(order.error).toBeUndefined();
    expect(order.val?.create_order.create_id).toEqual(id);
  });

  test.skip('should accept AbortController in getMatchedOrders request', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    const orders = await orderbook.getMatchedOrders(
      address,
      'pending',
      undefined,
      request,
    );
    expect(orders.error).toBeUndefined();
    expect(orders.val?.data).toBeDefined();
  });

  test.skip('should accept AbortController in getUnMatchedOrders request', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    const orders = await orderbook.getUnMatchedOrders(
      address,
      undefined,
      request,
    );
    expect(orders.error).toBeUndefined();
    expect(orders.val?.data).toBeDefined();
  });

  test.only('should accept AbortController in getOrders request', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    const orders = await orderbook.getOrders(true, {}, undefined, request);
    expect(orders.error).toBeUndefined();
    expect(orders.val?.data).toBeDefined();
  });

  test.skip('should accept AbortController in getOrdersCount request', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    const count = await orderbook.getOrdersCount(address, request);
    expect(count.error).toBeUndefined();
    expect(typeof count.val).toBe('number');
  });

  test.skip('should accept AbortController in subscribeOrders request', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    const unsubscribe = await orderbook.subscribeOrders(
      address,
      true,
      1000,
      async (orders) => {
        expect(orders.data).toBeDefined();
      },
      'all',
      undefined,
      request,
    );

    expectTypeOf(unsubscribe).toEqualTypeOf<() => void>();
    unsubscribe(); // Clean up
  });

  test.skip('should handle aborted requests gracefully', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    // Abort the request immediately
    abortController.abort();

    const order = await orderbook.getOrder(id, true, request);
    expect(order.error).toBeDefined();
    expect(order.error).toContain('aborted');
  });

  test.skip('should handle custom retry configuration with AbortController', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 1,
      retryDelay: 500,
    };

    const orders = await orderbook.getMatchedOrders(
      address,
      'all',
      undefined,
      request,
    );
    expect(orders.error).toBeUndefined();
    expect(orders.val?.data).toBeDefined();
  });

  test.skip('should work with partial request configuration', async () => {
    const request: UtilsRequest = {
      retryCount: 0,
      // No signal provided
    };

    const order = await orderbook.getOrder(id, true, request);
    expect(order.error).toBeUndefined();
    expect(order.val?.create_order.create_id).toEqual(id);
  });

  test('should work with empty request object', async () => {
    const request: UtilsRequest = {};

    const order = await orderbook.getOrder(id, true, request);
    expect(order.error).toBeUndefined();
    expect(order.val?.create_order.create_id).toEqual(id);
  });

  test('should handle multiple concurrent requests with different AbortControllers', async () => {
    const abortController1 = new AbortController();
    const abortController2 = new AbortController();

    const request1: UtilsRequest = {
      signal: abortController1.signal,
      retryCount: 0,
    };

    const request2: UtilsRequest = {
      signal: abortController2.signal,
      retryCount: 0,
    };

    const [order1, order2] = await Promise.all([
      orderbook.getOrder(id, true, request1),
      orderbook.getOrder(id, true, request2),
    ]);

    expect(order1.error).toBeUndefined();
    expect(order2.error).toBeUndefined();
    expect(order1.val?.create_order.create_id).toEqual(id);
    expect(order2.val?.create_order.create_id).toEqual(id);
  });

  test('should handle AbortController timeout scenario', async () => {
    const abortController = new AbortController();
    const request: UtilsRequest = {
      signal: abortController.signal,
      retryCount: 0,
    };

    // Set a timeout to abort the request
    setTimeout(() => {
      abortController.abort();
    }, 100);

    const order = await orderbook.getOrder(id, true, request);
    // The request might complete before timeout or be aborted
    // Both scenarios should be handled gracefully
    expect(order).toBeDefined();
  });

  test('should validate Request type compatibility', () => {
    // Test that UtilsRequest is compatible with the expected interface
    const request: UtilsRequest = {
      signal: new AbortController().signal,
      retryCount: 0,
      retryDelay: 1000,
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
    };

    expect(request.signal).toBeDefined();
    expect(request.retryCount).toBe(0);
    expect(request.retryDelay).toBe(1000);
    expect(request.headers).toBeDefined();
    expect(request.method).toBe('GET');
  });
});

test.only('should search orders', async () => {
  const orderbookApi = 'https://testnet.api.garden.finance/orders';
  const orderbook = new Orderbook(new Url(orderbookApi));
  const controller = new AbortController();
  const signal = controller.signal;
  const now = performance.now();
  setTimeout(() => {
    controller.abort();
    console.log('aborted');
  }, 1000);

  const result = await orderbook.getOrders(
    true,
    { page: 1, per_page: 10 },
    '0xccF3d872b01762ABA74b41B1958A9A86EE8f34A3',
    undefined,
    undefined,
    undefined,
    undefined,
    { signal, retryCount: 0 }
  );

  console.log('time taken :', performance.now() - now);
  console.log('result :', result);
  return {
    type: 'none',
    orders: [],
  };
}, 10000)

// describe('orderbook', async () => {
//   const OrderbookApi = 'orderbook.garden.finance';

//   const pk =
//     '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
//   const account = privateKeyToAccount(with0x(pk));
//   const walletClient = createWalletClient({
//     account,
//     chain: sepolia,
//     transport: http(),
//   });
//   const bitcoinTestnetAddress = 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru';
//   const sepoliaAddress = walletClient.account.address;

//   const auth = new Siwe(new Url('http://' + OrderbookApi + '/'), walletClient);

//   const orderbook = new Orderbook(new Url('http://' + OrderbookApi + '/'));

//   const createOrderIds: string[] = [];

//   const bitcoinAsset: Asset = {
//     name: 'Bitcoin Regtest',
//     decimals: 8,
//     symbol: 'BTC',
//     chain: Chains.bitcoin_regtest,
//     atomicSwapAddress: 'primary',
//     tokenAddress: 'primary',
//   };
//   const WBTCArbitrumLocalnetAsset: Asset = {
//     name: 'WBTC Arbitrum Localnet',
//     decimals: 8,
//     symbol: 'WBTC',
//     chain: Chains.arbitrum_localnet,
//     atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
//     tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
//   };
//   const WBTCEthereumLocalnetAsset: Asset = {
//     name: 'WBTC Ethereum Localnet',
//     decimals: 8,
//     symbol: 'WBTC',
//     chain: Chains.ethereum_localnet,
//     atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
//     tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
//   };

//   const createOrderConfigs: CreateOrderRequestWithAdditionalData[] = [
//     {
//       source_chain: WBTCEthereumLocalnetAsset.chain,
//       destination_chain: WBTCArbitrumLocalnetAsset.chain,
//       source_asset: WBTCEthereumLocalnetAsset.atomicSwapAddress,
//       destination_asset: WBTCArbitrumLocalnetAsset.atomicSwapAddress,
//       initiator_source_address: sepoliaAddress,
//       initiator_destination_address: sepoliaAddress,
//       source_amount: '100000',
//       destination_amount: '99000',
//       fee: '1',
//       nonce: '1',
//       timelock: 246,
//       secret_hash: sha256(randomBytes(32)),
//       min_destination_confirmations: 3,
//       additional_data: {
//         strategy_id: '1',
//       },
//     },
//     {
//       fromAsset: WBTCArbitrumLocalnetAsset,
//       toAsset: bitcoinAsset,
//       sendAddress: bitcoinTestnetAddress,
//       receiveAddress: sepoliaAddress,
//       sendAmount: '100000',
//       receiveAmount: '99000',
//       secretHash: sha256(randomBytes(32)),
//       nonce: '1',
//       timelock: 246,
//       minDestinationConfirmations: 3,
//       btcInputAddress: bitcoinTestnetAddress,
//     },
//     // {
//     //   fromAsset: WBTCEthereumLocalnetAsset,
//     //   toAsset: bitcoinAsset,
//     //   sendAddress: sepoliaAddress,
//     //   receiveAddress: bitcoinTestnetAddress,
//     //   sendAmount: '100000',
//     //   receiveAmount: '99000',
//     //   secretHash: sha256(randomBytes(32)),
//     //   nonce: '1',
//     //   timelock: 246,
//     //   minDestinationConfirmations: 3,
//     //   btcInputAddress: bitcoinTestnetAddress,
//     // },
//   ];

//   test('creates 3 orders', async () => {
//     for (const createOrder of createOrderConfigs) {
//       const response = await orderbook.createOrder(createOrder, auth);
//       console.log('response :', response.val);
//       if (response.error) {
//         console.log('response.error :', response.error);
//       }
//       createOrderIds.push(response.val);
//       expect(response.ok).toBeTruthy();
//     }
//   });

//   test('get the above created order after 5 sec of waiting', async () => {
//     // wait for the created order to be matched
//     await sleep(5000);
//     const orderId = createOrderIds[0];
//     const result = await orderbook.getOrder(orderId, true);
//     expectTypeOf(result.val).toEqualTypeOf<MatchedOrder>();
//     expect(result.ok).toBeTruthy();
//     expect(result.val).toBeTruthy();
//     expect(result.val.create_order.create_id).toEqual(orderId);
//   }, 10000);
// });
