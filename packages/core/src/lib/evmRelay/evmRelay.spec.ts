import { sha256 } from 'ethers';
import { EvmRelay } from './evmRelay';
import { Siwe, Url } from '@gardenfi/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { beforeAll, describe, expect, it } from 'vitest';
import { createWalletClient, http } from 'viem';
import { MatchedOrder, Orderbook } from '@gardenfi/orderbook';
import { randomBytes } from 'crypto';
import { sleep } from '@catalogfi/utils';
import {
  ArbitrumLocalnet,
  WBTCArbitrumLocalnetAsset,
  WBTCEthereumLocalnetAsset,
} from '../testUtils';

describe('evmRelay', () => {
  const relayUrl = 'http://localhost:4426/';
  const privKey =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const account = privateKeyToAccount(privKey);
  const walletClient = createWalletClient({
    account,
    chain: ArbitrumLocalnet,
    transport: http(),
  });

  const url = new Url(relayUrl);
  const auth = new Siwe(url, walletClient);
  const relayer = new EvmRelay(relayUrl, walletClient, auth);
  const orderBook = new Orderbook({
    url: relayUrl,
    walletClient,
  });
  let orderId: string = '';

  const createOrderConfig = {
    fromAsset: WBTCArbitrumLocalnetAsset,
    toAsset: WBTCEthereumLocalnetAsset,
    sendAddress: walletClient.account.address,
    receiveAddress: walletClient.account.address,
    sendAmount: '100000',
    receiveAmount: '99000',
    secretHash: sha256(randomBytes(32)),
    nonce: '1',
    timelock: 246,
    minDestinationConfirmations: 3,
  };

  beforeAll(async () => {
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

  describe('orderMatch status and init', () => {
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
    });

    it('order should be valid', () => {
      expect(order).toBeTruthy();
    });

    it('should init the order', async () => {
      console.log('initiating');
      if (!order) {
        expect(false).toBeTruthy();
        return;
      }
      const res = await relayer.init(order, WBTCArbitrumLocalnetAsset);
      console.log('res :', res.val);
      if (res.error) console.log('res.error :', res.error);
      expect(res.ok).toBeTruthy();
    });

    console.log('orderID', orderId);
  }, 15000);
});
