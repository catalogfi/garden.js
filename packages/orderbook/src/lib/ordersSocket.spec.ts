import { JsonRpcProvider, Wallet } from 'ethers';
import { Orderbook } from './orderbook';
import { OrdersSocket } from './ordersSocket';
import { Orders } from './orderbook.types';
import { startWsServer } from './testUtils';

import * as dotenv from 'dotenv';
import * as path from 'path';

import { describe, it, expect, beforeAll } from 'vitest';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

describe('Order Socket', () => {
  const OrderbookApi = 'http://localhost:8080';
  const provider = new JsonRpcProvider('localhost:8545');
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const wallet = new Wallet(pk, provider);

  const orderbook = new Orderbook({
    url: OrderbookApi,
    signer: wallet,
  });

  const DUMMY_OrderbookApi = 'ws://localhost:8081';

  beforeAll(() => {
    startWsServer();
  });
  it(
    'should subscribe and listen to orders',
    async () => {
      const orderbookOrders = await orderbook.getOrders(
        await wallet.getAddress()
      );
      const ordersSocket = new OrdersSocket(OrderbookApi.replace('http', 'ws'));
      const ordersSocketOrders: Orders = await new Promise(
        async (resolve, reject) => {
          ordersSocket.subscribe(await wallet.getAddress(), (orders) => {
            resolve(orders);
          });
        }
      );

      expect(orderbookOrders.length).toEqual(ordersSocketOrders.length);
      ordersSocket.unsubscribe();
    },
    20 * 1000
  );

  it(
    'should retry when error is encountered and get orders',
    async () => {
      const ordersSocket = new OrdersSocket(DUMMY_OrderbookApi);
      const orders: Orders = await new Promise(async (resolve, reject) => {
        ordersSocket.subscribe(await wallet.getAddress(), (orders) => {
          resolve(orders);
        });
      });

      expect(orders[0].ID).toEqual(1);

      ordersSocket.unsubscribe();
    },
    10 * 1000
  );

  it(
    'should retry after timeout',
    async () => {
      const ordersSocket = new OrdersSocket(DUMMY_OrderbookApi);

      let counter = 0;
      let orders: Orders = await new Promise(async (resolve, reject) => {
        ordersSocket.subscribe(await wallet.getAddress(), (socketOrders) => {
          counter++;
          if (counter == 2) resolve(socketOrders);
        });
      });

      expect(orders[1].ID).toEqual(2);

      ordersSocket.unsubscribe();
    },
    70 * 1000
  );
});
