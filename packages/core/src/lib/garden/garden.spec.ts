import { Garden } from './garden';
import { SecretManager } from './../secretManager/secretManager';
import { sleep, with0x } from '@gardenfi/utils';
import { createWalletClient, http, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ArbitrumLocalnet,
  createOrderObject,
  EthereumLocalnet,
} from '../testUtils';
import { Chain, Chains, Orderbook } from '@gardenfi/orderbook';
import { ISecretManager } from '../secretManager/secretManager.types';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
  IBitcoinProvider,
} from '@catalogfi/wallets';
// import { toXOnly } from '../utils';

describe('garden', () => {
  const orderBookApi = 'http://localhost:4426';
  const bitcoinProviderApi = 'http://localhost:30000';
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const account = privateKeyToAccount(with0x(pk));

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: ArbitrumLocalnet,
    transport: http(),
  });
  const ethereumWalletClient = createWalletClient({
    account,
    chain: EthereumLocalnet,
    transport: http(),
  });

  const orderBook = new Orderbook({
    url: orderBookApi,
    walletClient: arbitrumWalletClient,
  });

  let secretManager: ISecretManager;
  let garden: Garden;
  let evmAddress = account.address;
  let btcPubkey: string;
  let btcAddress: string;
  let bitcoinProvider: IBitcoinProvider;
  let btcWallet: BitcoinWallet;
  let wallets: Partial<{ [key in Chain]: WalletClient | BitcoinWallet }> = {};

  beforeAll(async () => {
    const result = await SecretManager.fromWalletClient(arbitrumWalletClient);
    if (result.error) {
      throw new Error(result.error);
    }
    expect(result.val).toBeTruthy();

    secretManager = result.val;
    garden = new Garden(orderBook, orderBookApi, secretManager);
    evmAddress = arbitrumWalletClient.account.address;
    bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Regtest,
      bitcoinProviderApi,
    );
    btcWallet = BitcoinWallet.fromPrivateKey(
      secretManager.getMasterPrivKey(),
      bitcoinProvider,
    );
    btcPubkey = await btcWallet.getPublicKey();
    btcAddress = await btcWallet.getAddress();
    if (
      !secretManager ||
      !btcPubkey ||
      !garden ||
      !bitcoinProvider ||
      !btcWallet ||
      !evmAddress ||
      !btcAddress
    ) {
      throw new Error('Failed to initialize');
    }
    wallets = {
      [Chains.arbitrum_localnet]: arbitrumWalletClient,
      [Chains.ethereum_localnet]: ethereumWalletClient,
      [Chains.bitcoin_regtest]: btcWallet,
    };
  });

  let orderId: string;

  it('should create an order', async () => {
    // const order = createOrderObject(
    //   Chains.arbitrum_localnet,
    //   Chains.bitcoin_regtest,
    //   evmAddress,
    //   toXOnly(btcPubkey),
    //   btcAddress,
    // );
    // const order = createOrderObject(
    //   Chains.bitcoin_regtest,
    //   Chains.arbitrum_localnet,
    //   toXOnly(btcPubkey),
    //   evmAddress,
    //   btcAddress,
    // );
    const order = createOrderObject(
      Chains.arbitrum_localnet,
      Chains.ethereum_localnet,
      arbitrumWalletClient.account.address,
      ethereumWalletClient.account.address,
    );

    const result = await garden.swap(order);

    orderId = result.val;
    console.log('orderIds :', orderId);
    if (!orderId) {
      throw new Error('Order id not found');
    }
    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();
  });

  it('order should be matched', async () => {
    if (!orderId) {
      throw new Error('Order id not found');
    }
    let res = await orderBook.getOrder(orderId, true);
    let order = res.val;
    while (!order) {
      res = await orderBook.getOrder(orderId, true);
      order = res.val;
      console.log('unmatched');
      await sleep(1000);
    }
    console.log('matched');
  }, 10000);

  it('subscribe to orders and execute', async () => {
    await garden.subscribeOrders(async (orderExecutor) => {
      const sourceWallet = wallets[orderExecutor.getOrder().source_swap.chain];
      const destWallet =
        wallets[orderExecutor.getOrder().destination_swap.chain];

      if (!sourceWallet || !destWallet) {
        throw new Error('Wallets not found');
      }

      if (orderExecutor.getOrder().create_order.create_id === orderId) {
        console.log(
          'executing order ',
          orderExecutor.getOrder().create_order.create_id,
        );
        const res = await orderExecutor.execute({
          wallets: {
            source: sourceWallet,
            destination: destWallet,
          },
          secretManager,
        });
        console.log('execute result :', res.val);
        console.log('execute error: ', res.error);
      }
    });
    await sleep(150000);
  }, 150000);
});
