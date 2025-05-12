// import { sepolia } from 'viem/chains';
// import { privateKeyToAccount } from 'viem/accounts';
// import { createWalletClient, http, sha256 } from 'viem';
// import { randomBytes } from 'crypto';
import { describe, expect, expectTypeOf, test } from 'vitest';
import {
  //  Siwe, sleep,
  // with0x,
  Url,
} from '@gardenfi/utils';
import { Orderbook } from './orderbook';
import {
  // CreateOrderConfig,
  // CreateOrderRequestWithAdditionalData,
  MatchedOrder,
} from './orderbook.types';
// import { Asset, Chains } from '../asset';

describe('orders provider', async () => {
  const orderbookApi = 'https://orderbook-v2-staging.hashira.io';
  const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
  const id = 'c519b735bcef0a6bd6a54ac7d46449087b2146cae75541c2ddde686cf8fba294';

  const orderbook = new Orderbook(new Url(orderbookApi));

  test.only('should get order', async () => {
    const order = await orderbook.getOrder(id, true);
    console.log('order.error :', order.error);
    console.log('order.val :', order.val);
    expect(order.error).toBeUndefined();
    expect(order.val.create_order.create_id).toEqual(id);
    expectTypeOf(order.val).toEqualTypeOf<MatchedOrder>();
  });

  test('should get orders of a address', async () => {
    const orders = await orderbook.getMatchedOrders(address, false);
    expect(orders.error).toBeUndefined();
    expect(orders.val.data.length).toBeGreaterThan(0);
    expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
  });

  test('should get all orders', async () => {
    const orders = await orderbook.getOrders(true);
    expect(orders.error).toBeUndefined();
    expect(orders.val.data.length).toBeGreaterThan(0);
    expectTypeOf(orders.val.data).toEqualTypeOf<MatchedOrder[]>();
  });

  test('should subscribe to orders', async () => {
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
  });

  test('order count', async () => {
    const count = await orderbook.getOrdersCount(address);
    expect(count.error).toBeUndefined();
    expect(count.val).toBe(0);
  });
});

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
