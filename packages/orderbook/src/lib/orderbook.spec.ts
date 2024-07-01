import { Orderbook } from './orderbook';
import { JsonRpcProvider, Wallet, sha256 } from 'ethers';
import * as crypto from 'crypto';
import { Order } from './orderbook.types';
import { Assets } from './asset';
import { OrderbookErrors } from './errors';

import * as dotenv from 'dotenv';
import * as path from 'path';
import { MemoryStorage } from './store/memoryStorage';
import { StoreKeys } from './store/store.interface';

import { describe, test, expect } from 'vitest';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

describe.only('orderbook', () => {
  if (!process.env['BACKEND_URL']) {
    throw new Error('BACKEND_URL not set');
  }
  const API_ENDPOINT = process.env['BACKEND_URL'];
  if (!process.env['ANKR_RPC_URL']) {
    throw new Error('ANKR_RPC_URL not set');
  }

  const bitcoin_testnet_address = 'tb1qf97p3cwpzkqxwqy5akj22eqrqksumd9t2hwl8j';
  const sepolia_address = '0x236396E7c79ef96232AA052aF8ee4eb1bCBC0830';
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const provider = new JsonRpcProvider(process.env['ANKR_RPC_URL']);
  const wallet = new Wallet(pk, provider);
  const orderbook = new Orderbook({
    url: 'https://' + API_ENDPOINT + '/',
    signer: wallet,
  });

  test('should not create an order with the invalid configuration', async () => {
    const inputAmount = 0.001;
    const outputAmount = 0.001;

    const createOrderConfig = {
      fromAsset: Assets.bitcoin_testnet.BTC,
      toAsset: Assets.ethereum_sepolia.WBTC,
      sendAddress: bitcoin_testnet_address,
      receiveAddress: sepolia_address,
      sendAmount: inputAmount.toString(),
      receiveAmount: outputAmount.toString(),
      secretHash: sha256(crypto.randomBytes(32)),
      btcInputAddress: bitcoin_testnet_address,
    };

    await expect(orderbook.createOrder(createOrderConfig)).rejects.toThrow(
      OrderbookErrors.INVALID_SEND_AMOUNT
    );

    createOrderConfig.sendAmount = (inputAmount * 1e8).toString();

    await expect(orderbook.createOrder(createOrderConfig)).rejects.toThrow(
      OrderbookErrors.INVALID_RECEIVE_AMOUNT
    );
  });

  test('should create an order with the valid configuration', async () => {
    const inputAmount = 0.001 * 1e8;
    const outputAmount = inputAmount - 0.01 * inputAmount;

    const response = await orderbook.createOrder({
      fromAsset: Assets.bitcoin_testnet.BTC,
      toAsset: Assets.ethereum_sepolia.WBTC,
      sendAddress: bitcoin_testnet_address,
      receiveAddress: sepolia_address,
      sendAmount: inputAmount.toString(),
      receiveAmount: outputAmount.toString(),
      secretHash: sha256(crypto.randomBytes(32)),
      btcInputAddress: bitcoin_testnet_address,
    });

    expect(response).toBeTruthy();
    expect(response).toBeGreaterThan(0);
  }, 15000);

  test('should return orders where the user is the maker', async () => {
    const res = await orderbook.getOrders(wallet.address, {
      taker: false,
      verbose: true,
    });

    expect(res).toBeTruthy();

    const makerFilter = res.filter(
      (order) => order.maker === wallet.address.toLowerCase()
    );

    expect(makerFilter.length).toEqual(res.length);
  }, 25000);

  test('should update when order is created', async () => {
    const orders = await new Promise<Order[]>((resolve) => {
      orderbook.subscribeOrders(wallet.address, (orders) => {
        resolve(orders);
      });
    });
    orderbook.unsubscribeOrders();
    expect(orders.length).toBeGreaterThanOrEqual(0);
  }, 35000);

  test('should initiate with an auth token', async () => {
    const store = new MemoryStorage();
    await Orderbook.init({
      url: 'https://' + API_ENDPOINT + '/',
      signer: wallet,
      opts: {
        store,
      },
    });
    expect(store.getItem(StoreKeys.AUTH_TOKEN)).toBeTruthy();
  });
});
