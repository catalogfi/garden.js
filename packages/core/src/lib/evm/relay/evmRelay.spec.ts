import { EvmRelay } from './evmRelay';
import { privateKeyToAccount } from 'viem/accounts';
import { beforeAll, describe, expect, it } from 'vitest';
import { createWalletClient, http, createPublicClient, sha256 } from 'viem';
import { MatchedOrder, Orderbook } from '@gardenfi/orderbook';
import { randomBytes } from 'crypto';
import { sleep } from '@catalogfi/utils';
import {
  ArbitrumLocalnet,
  // EthereumLocalnet,
  WBTCArbitrumLocalnetAsset,
  WBTCEthereumLocalnetAsset,
} from '../../testUtils';
import { Siwe, Url } from 'gardenfi/utils';
// import { ParseOrderStatus } from '../order/parseOrderStatus';
// import { OrderStatus } from '../order/order.types';

describe('evmRelay', () => {
  const relayUrl = 'http://localhost:4426/';
  // const bitcoinIndexer = 'http://localhost:30000';
  const privKey =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const account = privateKeyToAccount(privKey);
  const arbitrumWalletClient = createWalletClient({
    account,
    chain: ArbitrumLocalnet,
    transport: http(),
  });
  const arbitrumPublicClient = createPublicClient({
    chain: arbitrumWalletClient.chain,
    transport: http(),
  });
  // const ethereumClient = createWalletClient({
  //   account,
  //   chain: EthereumLocalnet,
  //   transport: http(),
  // });
  // const ethereumPublicClient = createPublicClient({
  //   chain: ethereumClient.chain,
  //   transport: http(),
  // });
  const auth = new Siwe(new Url(relayUrl), arbitrumWalletClient);
  const relayer = new EvmRelay(relayUrl, arbitrumWalletClient, auth);
  const orderBook = new Orderbook({
    url: relayUrl,
    walletClient: arbitrumWalletClient,
  });
  let orderId: string = '';
  const secret = sha256(randomBytes(32));
  const secretHash = sha256(secret);

  beforeAll(async () => {
    const currentBlockNumber = await arbitrumPublicClient.getBlockNumber();

    const createOrderConfig = {
      fromAsset: WBTCArbitrumLocalnetAsset,
      toAsset: WBTCEthereumLocalnetAsset,
      sendAddress: arbitrumWalletClient.account.address,
      receiveAddress: arbitrumWalletClient.account.address,
      sendAmount: '100000',
      receiveAmount: '99000',
      secretHash: secretHash,
      nonce: '1',
      timelock: Number(currentBlockNumber) + 100,
      minDestinationConfirmations: 3,
    };
    console.log('creating order');
    const response = await orderBook.createOrder(createOrderConfig);
    console.log('response :', response.val);
    if (response.error) console.log('response.error :', response.error);
    orderId = response.val;
    expect(response.ok).toBeTruthy();
    expect(true).toBe(true);
  });

  it('should create a order', () => {
    expect(orderId).toBeDefined();
  });

  describe('order should be matched and then init', () => {
    let order: MatchedOrder | null = null;

    beforeAll(async () => {
      while (!order) {
        console.log('orderId :', orderId);
        const res = await orderBook.getOrder(orderId, true);
        if (res.val) order = res.val;
        await sleep(1000);
      }
      console.log('matched');
      expect(order.create_order.create_id).toBeTruthy();
    }, 20000);

    it('order should be valid', () => {
      expect(order).toBeTruthy();
    });

    it('should init the order', async () => {
      console.log('initiating');
      if (!order) {
        expect(false).toBeTruthy();
        return;
      }

      const blockNumber = await arbitrumPublicClient.getBlockNumber();

      const res = await relayer.init(
        order,
        // WBTCArbitrumLocalnetAsset,
        Number(blockNumber),
      );
      console.log('res :', res.val);
      if (res.error) console.log('res.error :', res.error);
      expect(res.ok).toBeTruthy();
    });

    describe('redeem after filler init', () => {
      beforeAll(async () => {
        let order = await orderBook.getOrder(orderId, true);
        // let sourceBlockNumber = await arbitrumPublicClient.getBlockNumber();
        // let destBlockNumber = await ethereumPublicClient.getBlockNumber();
        // let orderStatus = ParseOrderStatus(
        //   order.val,
        //   Number(sourceBlockNumber),
        //   Number(destBlockNumber),
        // );
        // while (orderStatus !== OrderStatus.CounterPartyInitiated) {
        //   order = await orderBook.getOrder(orderId, true);
        //   sourceBlockNumber = await arbitrumPublicClient.getBlockNumber();
        //   destBlockNumber = await ethereumPublicClient.getBlockNumber();
        //   orderStatus = ParseOrderStatus(
        //     order.val,
        //     Number(sourceBlockNumber),
        //     Number(destBlockNumber),
        //   );
        //   console.log('orderStatus :', orderStatus);
        //   await sleep(1000);
        // }
        // console.log('orderStatus :', orderStatus);
        while (order.val.destination_swap.initiate_tx_hash === '') {
          order = await orderBook.getOrder(orderId, true);
          await sleep(1000);
        }
        console.log('counterpartyInitiated');
      }, 50000);
      it('should redeem the order', async () => {
        console.log('redeeming');
        console.log('secret: ', secret);
        if (!order) {
          expect(false).toBeTruthy();
          return;
        }

        const res = await relayer.redeem(orderId, secret);
        console.log('res :', res.val);
        if (res.error) console.log('res.error :', res.error);
        expect(res.ok).toBeTruthy();
      });
    });

    console.log('orderID', orderId);
  }, 15000);
});
