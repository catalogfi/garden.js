import { Garden } from '../garden';
import { MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, Siwe, Url, with0x } from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { beforeAll, describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import { createWalletClient, http } from 'viem';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
import { EvmRelay, Quote } from '@gardenfi/core';
import { StarknetRelay } from '../../starknet/relay/starknetRelay';
import { arbitrumSepolia } from 'viem/chains';

describe('StarkNet Integration Tests - EVM -> STRK', () => {
  // Constants
  //   const RELAYER_URL = 'http://localhost:4426';
  //   const STARKNET_NODE_URL = 'http://localhost:8547/rpc';
  //   const QUOTE_SERVER_URL = 'http://localhost:6969';
  //   const STARKNET_RELAY_URL = 'http://localhost:4436';
  //   const API_KEY =
  //     'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c';

  const RELAYER_URL = 'https://orderbook-stage.hashira.io';
  const STARKNET_NODE_URL =
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/Ry6QmtzfnqANtpqP3kLqe08y80ZorPoY';
  const QUOTE_SERVER_URL = 'https://quote-staging.hashira.io';
  const STARKNET_RELAY_URL = 'https://starknet-relayer.hashira.io';
  // const API_KEY =
  //   'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c';

  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  //   const STARKNET_PRIVATE_KEY =
  //     '0x00000000000000000000000000000000c10662b7b247c7cecf7e8a30726cff12';
  //   const STARKNET_ADDRESS =
  //     '0x0260a8311b4f1092db620b923e8d7d20e76dedcc615fb4b6fdf28315b81de201';
  const STARKNET_PRIVATE_KEY =
    '0x0440c893bd4cbc2c151d579c9d721eec4d316306f871368baa89033e3f6820b9';
  const STARKNET_ADDRESS =
    '0x0390cf09b3537e450170bdcce49a789facb727f21eabd8e1d25b8cf1869e8e93';

  // Global variables
  let garden: Garden;
  let evmWallet: any;
  let starknetWallet: Account;

  beforeAll(async () => {
    // Initialize EVM wallet
    const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
    console.log('Ethereum account address:', evmAccount.address);
    evmWallet = createWalletClient({
      account: evmAccount,
      chain: arbitrumSepolia,
      transport: http(),
    });

    // Initialize StarkNet wallet
    const snProvider = new RpcProvider({ nodeUrl: STARKNET_NODE_URL });
    starknetWallet = new Account(
      snProvider,
      STARKNET_ADDRESS,
      STARKNET_PRIVATE_KEY,
    );
    console.log('StarkNet account address:', starknetWallet.address);

    const bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Testnet,
      'https://48.217.250.147:18443',
    );

    // const bitcoinProvider = new BitcoinProvider(
    //   BitcoinNetwork.Regtest,
    //   'https://localhost:30000',
    // );

    const btcWallet = BitcoinWallet.fromPrivateKey(
      '3cd7c7cd08c2eb6aeac37e5654a05ebc2e92afe0adf109ea0c615c7cb8d9831f',
      bitcoinProvider,
    );
    console.log('Bitcoin account address:', btcWallet.getAddress());

    garden = new Garden({
      api: RELAYER_URL,
      environment: Environment.TESTNET,
      digestKey:
        '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
      quote: new Quote(QUOTE_SERVER_URL),
      htlc: {
        evm: new EvmRelay(
          RELAYER_URL,
          evmWallet,
          Siwe.fromDigestKey(
            new Url(RELAYER_URL),
            '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
          ),
        ),
        starknet: new StarknetRelay(
          STARKNET_RELAY_URL,
          starknetWallet,
          Siwe.fromDigestKey(
            new Url(RELAYER_URL),
            '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
          ),
        ),
      },
    });
  }, 5000000);

  const setupEventListeners = () => {
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
  };
  let matchedorder: MatchedOrder;
  it('should create order and match', async () => {
    const order = {
      fromAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
      toAsset: SupportedAssets.testnet.starknet_testnet_ETH,
      sendAmount: '10000',
      receiveAmount: '2375000000000000',
      additionalData: {
        strategyId: 'asacssab',
      },
      minDestinationConfirmations: 3,
    };

    const result = await garden.swap(order);
    if (result.error) {
      console.log('Error while creating order ❌:', result.error);
      throw new Error(result.error);
    }

    console.log(
      'Order created and matched✅',
      result.val.create_order.create_id,
    );
    // console.log(result.val.source_swap.asset);
    matchedorder = result.val;

    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();
  }, 150000);

  it('Initiate the swap', async () => {
    const res = await garden.evmHTLC.initiate(matchedorder);
    console.log('initiated ✅ :', res.val);
    if (res.error) console.log('init error ❌ :', res.error);
    // expect(res.ok).toBeTruthy();
    expect(res.ok).toBeTruthy();
  }, 20000);

  it('Execute', async () => {
    setupEventListeners();
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
