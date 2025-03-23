import { Garden } from '../garden';
import { EthereumLocalnet, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, with0x } from '@gardenfi/utils';
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

describe('StarkNet Integration Tests', () => {
  // Constants
  const RELAYER_URL = 'http://localhost:4426';
  const STARKNET_NODE_URL = 'http://localhost:8547/rpc';
  const QUOTE_SERVER_URL = 'http://localhost:6969';
  const STARKNET_RELAY_URL = 'http://localhost:4436';
  const API_KEY =
    'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c';

  // const RELAYER_URL = 'https://orderbook-stage.hashira.io';
  // const STARKNET_NODE_URL =
  //   'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/Ry6QmtzfnqANtpqP3kLqe08y80ZorPoY';
  // const QUOTE_SERVER_URL = 'https://quote-staging.hashira.io';
  // const STARKNET_RELAY_URL = 'https://starknet-relayer.hashira.io';
  // const API_KEY =
  //   'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c';

  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const STARKNET_PRIVATE_KEY =
    '0x00000000000000000000000000000000c10662b7b247c7cecf7e8a30726cff12';
  const STARKNET_ADDRESS =
    '0x0260a8311b4f1092db620b923e8d7d20e76dedcc615fb4b6fdf28315b81de201';

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
      chain: EthereumLocalnet,
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

    // const bitcoinProvider = new BitcoinProvider(
    //   BitcoinNetwork.Testnet,
    //   'https://48.217.250.147:18443',
    // );

    const bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Regtest,
      'https://localhost:30000',
    );

    const btcWallet = BitcoinWallet.fromPrivateKey(
      '3cd7c7cd08c2eb6aeac37e5654a05ebc2e92afe0adf109ea0c615c7cb8d9831f',
      bitcoinProvider,
    );

    // Initialize Garden
    garden = new Garden({
      environment: Environment.LOCALNET,
      evmWallet,
      starknetWallet,
      orderbookURl: RELAYER_URL,
      quote: QUOTE_SERVER_URL,
      apiKey: API_KEY,
      starknetRelayUrl: STARKNET_RELAY_URL,
      btcWallet,
    });
  }, 5000000);

  const setupEventListeners = () => {
    garden.on('error', (order, error) => {
      console.log(
        'Error while executing ❌, orderId:',
        order.create_order.create_id,
        'error:',
        error,
      );
    });

    garden.on('success', (order, action, result) => {
      console.log(
        'Executed ✅, orderId:',
        order.create_order.create_id,
        'action:',
        action,
        'result:',
        result,
      );
    });

    garden.on('log', (id, message) => {
      console.log('Log:', id, message);
    });

    garden.on('onPendingOrdersChanged', (orders) => {
      console.log('⏳Pending orders:', orders.length);
    });

    garden.on('rbf', (order, result) => {
      console.log('RBF:', order.create_order.create_id, result);
    });
  };

  it('should create and execute a ETH-Starknet swap', async () => {
    const order = {
      fromAsset: SupportedAssets.localnet.ethereum_localnet_WBTC,
      toAsset: SupportedAssets.localnet.starknet_localnet_STRK,
      sendAmount: '1000',
      receiveAmount: '1000',
      additionalData: {
        strategyId: 'elsd13',
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
    console.log(result.val.source_swap.asset);

    // Initiate the swap
    const evmResponse = await garden.evmRelay?.init(evmWallet, result.val);
    console.log('EVM response:', evmResponse);
    console.log('Swap initiated ✅:');
    // expect(res.ok).toBeTruthy();

    // Execute the swap
    console.log('Executing swap...');
    setupEventListeners();
    await garden.execute();
    console.log('Swap executed ✅');

    await sleep(150000);
    expect(result.val.destination_swap.redeem_tx_hash).toBeTruthy();
  }, 150000);
});
