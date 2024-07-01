import { JsonRpcProvider, Wallet } from 'ethers';
import { Orderbook } from './orderbook';
import { OrdersSocket } from './ordersSocket';
import { Orders } from './orderbook.types';

import * as dotenv from 'dotenv';
import * as path from 'path';

import { describe, it, expect } from 'vitest';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

describe.skip('Order Socket', () => {
  console.log('MAKE SURE TO RUN THE WS SERVER IN ./socketServer');
  if (!process.env['BACKEND_URL']) {
    throw new Error('BACKEND_URL not set');
  }

  if (!process.env['ANKR_RPC_URL']) {
    throw new Error('ANKR_RPC_URL not set');
  }

  console.log(process.env['BACKEND_URL']);

  const API_ENDPOINT = process.env['BACKEND_URL'];
  const provider = new JsonRpcProvider(process.env['ANKR_RPC_URL']);
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const wallet = new Wallet(pk, provider);

  const orderbook = new Orderbook({
    url: API_ENDPOINT,
    signer: wallet,
  });

  const DUMMY_API_ENDPOINT = 'ws://localhost:8080';
  it(
    'should subscribe and listen to orders',
    async () => {
      const orderbookOrders = await orderbook.getOrders(
        await wallet.getAddress()
      );
      const ordersSocket = new OrdersSocket(
        API_ENDPOINT.replace('https', 'wss')
      );
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
      const ordersSocket = new OrdersSocket(DUMMY_API_ENDPOINT);
      const orders: Orders = await new Promise(async (resolve, reject) => {
        ordersSocket.subscribe(await wallet.getAddress(), (orders) => {
          console.log(orders);
          resolve(orders);
        });
      });

      expect(orders[0].ID).toEqual(1);

      ordersSocket.unsubscribe();
    },
    10 * 1000
  );

  it.only(
    'should retry after timeout',
    async () => {
      const ordersSocket = new OrdersSocket(DUMMY_API_ENDPOINT);

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
