import { Garden } from './garden';
import { SecretManager } from './../secretManager/secretManager';
import { MemoryStorage, sleep, with0x } from '@gardenfi/utils';
import { createWalletClient, http, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ArbitrumLocalnet,
  createOrderObject,
  EthereumLocalnet,
} from '../testUtils';
import { Chain, Chains, MatchedOrder, Orderbook } from '@gardenfi/orderbook';
import { ISecretManager } from '../secretManager/secretManager.types';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
  IBitcoinProvider,
} from '@catalogfi/wallets';
import { OrderExecutor } from '../orderExecutor/orderExecutor';
// import { toXOnly } from '../utils';

describe('garden', () => {
  const orderBookApi = 'http://localhost:4426';
  const quoteApi = 'http://localhost:6969';
  const bitcoinProviderApi = 'http://localhost:30000';
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const account = privateKeyToAccount(with0x(pk));
  console.log('account :', account.address);

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
    garden = new Garden(orderBook, secretManager, orderBookApi, quoteApi);
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

  let order: MatchedOrder;

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
    const orderObj = createOrderObject(
      Chains.arbitrum_localnet,
      Chains.ethereum_localnet,
      arbitrumWalletClient.account.address,
      ethereumWalletClient.account.address,
      'alel12',
    );

    const result = await garden.swap(orderObj);
    if (result.error) {
      console.log('error while creating order ❌ :', result.error);
      throw new Error(result.error);
    }

    order = result.val;
    console.log('orderCreated and matched ✅ ', order.create_order.create_id);
    if (!order) {
      throw new Error('Order id not found');
    }

    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();
  }, 60000);

  it('Initiate the swap', async () => {
    const orderExecutor = new OrderExecutor(
      order,
      orderBookApi,
      secretManager,
      {
        store: new MemoryStorage(),
      },
    );
    if (order.source_swap.chain === Chains.bitcoin_regtest) {
      expect(order.source_swap.chain).toBe(Chains.bitcoin_regtest);
    } else {
      const sourceWallet = wallets[order.source_swap.chain];
      const res = await orderExecutor.init(sourceWallet as WalletClient);

      console.log('init result ✅ :', res.val);
      if (res.error) console.log('init error ❌ :', res.error);
      expect(res.error).toBeFalsy();
      expect(res.val).toBeTruthy();
    }
  }, 60000);

  it('subscribe to orders and execute', async () => {
    await garden.subscribeOrders(async (orderExecutor) => {
      const sourceWallet = wallets[orderExecutor.getOrder().source_swap.chain];
      const destWallet =
        wallets[orderExecutor.getOrder().destination_swap.chain];

      if (!sourceWallet || !destWallet) throw new Error('Wallets not found');

      if (
        orderExecutor.getOrder().create_order.create_id ===
        order.create_order.create_id
      ) {
        console.log(
          'executing order.... ',
          orderExecutor.getOrder().create_order.create_id,
        );
        const res = await orderExecutor.execute({
          wallets: {
            source: sourceWallet,
            destination: destWallet,
          },
        });
        console.log('execute result :', res.val);
        if (res.error) console.log('execute error: ', res.error);
      }
    });
    await sleep(150000);
  }, 150000);
});
