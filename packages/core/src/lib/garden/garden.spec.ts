import { Garden } from './garden';
import { Environment, Siwe, Url, with0x } from '@gardenfi/utils';
import {
  createWalletClient,
  http,
  // WalletClient
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import {
  // Chain,
  // Chains,
  isBitcoin,
  MatchedOrder,
  SupportedAssets,

  // SupportedAssets,
} from '@gardenfi/orderbook';
import { sleep } from '@catalogfi/utils';
import {
  arbitrumSepolia,
  // sepolia
} from 'viem/chains';
import { EvmRelay } from './../evm/relay/evmRelay';
import { Quote } from '../quote/quote';
import { DigestKey } from './digestKey/digestKey';
// import { SecretManager } from '../secretManager/secretManager';
// import { DigestKey } from './digestKey/digestKey';
// import { BitcoinNetwork, BitcoinProvider } from '@catalogfi/wallets';
// import { Quote } from './../quote/quote';
// import { Orderbook } from 'gardenfi/orderbook';

describe('swap and execute using garden', () => {
  // const bitcoinAddress = 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru';
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  // const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
  const account = privateKeyToAccount(with0x(pk));
  const api = 'https://orderbook-v2-staging.hashira.io';
  console.log('account :', account.address);

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });
  // const ethereumWalletClient = createWalletClient({
  //   account,
  //   chain: sepolia,
  //   transport: http(),
  // });

  // const quote = new Quote('https://quote-choas.onrender.com/');
  // const orderBookUrl = 'https://evm-swapper-relay-1.onrender.com/';
  // const evmHTLC = new EvmRelay(
  //   'https://evm-swapper-relay-1.onrender.com/',
  //   arbitrumWalletClient,
  //   new Siwe({
  //     domain: 'evm-swapper-relay-1.onrender.com',
  //     nonce: '1',
  //   }),
  // );

  const digestKey = new DigestKey(
    '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
  );
  console.log('digestKey :', digestKey.userId);

  const garden = new Garden({
    api,
    environment: Environment.TESTNET,
    digestKey:
      '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
    quote: new Quote('https://testnet.api.hashira.io'),
    htlc: {
      evm: new EvmRelay(
        api,
        arbitrumWalletClient,
        Siwe.fromDigestKey(
          new Url(api),
          '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
        ),
      ),
    },
  });

  // let secret = await secretManager.generateSecret(order.create_order.nonce);

  // let wallets: Partial<{ [key in Chain]: WalletClient }> = {};

  // wallets = {
  //   [Chains.arbitrum_sepolia]: arbitrumWalletClient,
  //   [Chains.ethereum_sepolia]: ethereumWalletClient,
  //   // [Chains.bitcoin_regtest]: btcWallet,
  // };
  let order: MatchedOrder;

  it('should create an order', async () => {
    const orderObj = {
      fromAsset: {
        name: 'Wrapped Bitcoin',
        decimals: 8,
        symbol: 'WBTC',
        chain: 'arbitrum_sepolia',
        logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
        tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
        atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      } as const,
      toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
      sendAmount: '100000'.toString(),
      receiveAmount: '99700'.toString(),
      additionalData: {
        strategyId: 'asacbtyr',
        btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
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
  it('Initiate the swap', async () => {
    if (isBitcoin(order.source_swap.chain)) {
      console.warn('Bitcoin swap, skipping initiation');
    }
    if (!garden.evmHTLC) {
      console.warn('EVMHTLC is not initialized, skipping initiation');
      return;
    }

    const res = await garden.evmHTLC.initiate(order);
    console.log('initiated ✅ :', res.val);
    if (res.error) console.log('init error ❌ :', res.error);
    expect(res.ok).toBeTruthy();
  }, 20000);

  it('EXECUTE', async () => {
    garden.on('error', (order, error) => {
      console.log(
        'error while executing ❌, orderId :',
        order.create_order.create_id,
        'error :',
        error,
      );
    });
    garden.on('success', (order, action, result) => {
      console.log(
        'executed ✅, orderId :',
        order.create_order.create_id,
        'action :',
        action,
        'result :',
        result,
      );
    });
    garden.on('log', (id, message) => {
      console.log('log :', id, message);
    });
    garden.on('onPendingOrdersChanged', (orders) => {
      console.log('pending orders :', orders.length);
      orders.forEach((order) => {
        console.log('pending order :', order.create_order.create_id);
      });
    });
    garden.on('rbf', (order, result) => {
      console.log('rbf :', order.create_order.create_id, result);
    });
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
