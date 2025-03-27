import { Garden } from './garden';
import { Environment, with0x } from '@gardenfi/utils';
import { createWalletClient, http, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import { API } from '@gardenfi/utils';
import {
  Chain,
  Chains,
  isBitcoin,
  MatchedOrder,
  SupportedAssets,
} from '@gardenfi/orderbook';
import { sleep } from '@catalogfi/utils';
import { BitcoinNetwork, BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { ArbitrumLocalnet, EthereumLocalnet } from '../testUtils';
// import { Quote } from './../quote/quote';
// import { Orderbook } from 'gardenfi/orderbook';

describe('swap and execute using garden', () => {
  // const bitcoinAddress = 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru';
  const pk = API.pk;
  // const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
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

  // const quote = new Quote('https://quote-choas.onrender.com/');
  // const orderBookUrl = 'https://evm-swapper-relay-1.onrender.com/';

  const bitcoinProvider = new BitcoinProvider(
    BitcoinNetwork.Regtest,
    API.localnet.bitcoin
  );

  const btcWallet = BitcoinWallet.createRandom(bitcoinProvider);

  const garden = new Garden({
    // orderbookURl: orderBookUrl,
    // quote,
    environment: Environment.LOCALNET,
    evmWallet: arbitrumWalletClient,
    btcWallet,
  });
  let wallets: Partial<{ [key in Chain]: WalletClient }> = {};

  wallets = {
    [Chains.arbitrum_localnet]: arbitrumWalletClient,
    [Chains.ethereum_localnet]: ethereumWalletClient,
    // [Chains.bitcoin_regtest]: btcWallet,
  };

  let order: MatchedOrder;

  const setupEventListeners = () => {
    garden.on('error', (order, error) => {
      console.log('Error while executing ❌, orderId:', order.create_order.create_id, 'error:', error);
    });
    garden.on('success', (order, action, result) => {
      console.log('Executed ✅, orderId:', order.create_order.create_id, 'action:', action, 'result:', result);
    });
    garden.on('log', (id, message) => {
      console.log('Log:', id, message);
    });
    garden.on('onPendingOrdersChanged', (orders) => {
      console.log('Pending orders:', orders.length);
      orders.forEach((order) => {
        console.log('Pending order:', order.create_order.create_id);
      });
    });
    garden.on('rbf', (order, result) => {
      console.log('RBF:', order.create_order.create_id, result);
    });
  };

  it.skip('should create an order', async () => {
    const orderObj = {
      fromAsset: SupportedAssets.localnet.arbitrum_localnet_WBTC,
      toAsset: SupportedAssets.localnet.ethereum_localnet_WBTC,
      sendAmount: '10000',
      receiveAmount: '9990',
      additionalData: {
        strategyId: 'alel12',
      },
      minDestinationConfirmations: 0,
    };

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

  
  //TODO: also add bitcoin init
  it.skip('Initiate the swap', async () => {
    if (isBitcoin(order.source_swap.chain)) {
      console.warn('Bitcoin swap, skipping initiation');
    }
    const res = await garden.evmRelay.init(
      wallets[order.source_swap.chain] as WalletClient,
      order,
    );
    console.log('initiated ✅ :', res.val);
    if (res.error) console.log('init error ❌ :', res.error);
    expect(res.ok).toBeTruthy();
  }, 20000);
  
  it('Execute orders', async () => {
    setupEventListeners();
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
