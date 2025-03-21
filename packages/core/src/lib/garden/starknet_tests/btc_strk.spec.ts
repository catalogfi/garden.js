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
import axios from 'axios';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const RPC_USER = 'admin1';
const RPC_PASSWORD = '123';

async function mineBlock(addr: string, count: number): Promise<void> {
  try {
    const { data: mineData } = await axios.post(
      'http://localhost:18443',
      {
        jsonrpc: '1.0',
        id: 'generatetoaddress',
        method: 'generatetoaddress',
        params: [count, addr],
      },
      {
        auth: {
          username: RPC_USER,
          password: RPC_PASSWORD,
        },
      },
    );
    return mineData;
  } catch (error) {
    console.log('Mining failed : ', error);
  }
}

async function fund(addr: string): Promise<void> {
  try {
    await execAsync(`merry faucet --to ${addr}`);
  } catch (error) {
    console.log('Funding failed : ', error);
  }
}

describe('Bitcoin to StarkNet Integration Tests', () => {
  // Constants
  const RELAYER_URL = 'http://localhost:4426';
  const STARKNET_NODE_URL = 'http://localhost:8547/rpc';
  const QUOTE_SERVER_URL = 'http://localhost:6969';
  const STARKNET_RELAY_URL = 'http://localhost:4436';
  const API_KEY =
    'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c';

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
  let btcWallet: BitcoinWallet;
  let btcAddress: string;

  beforeAll(async () => {
    console.log('\n------ INITIALIZING WALLETS ------');

    // Initialize EVM wallet
    const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
    console.log('Ethereum Account:', evmAccount.address);
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
    console.log('StarkNet Account:', starknetWallet.address);

    // Initialize Bitcoin wallet
    const bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Regtest,
      'http://localhost:30000',
    );
    btcWallet = BitcoinWallet.fromPrivateKey(
      '3cd7c7cd08c2eb6aeac37e5654a05ebc2e92afe0adf109ea0c615c7cb8d9831f',
      bitcoinProvider,
    );
    btcAddress = await btcWallet.getAddress();
    console.log('Bitcoin Address:', btcAddress);

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
    console.log('------ INITIALIZATION COMPLETE ------\n');
  }, 5000000);

  const setupEventListeners = () => {
    garden.on('error', (order, error) => {
      console.log(
        '\n------ ERROR EVENT ------',
        '\nOrder ID:',
        order.create_order.create_id,
        '\nError:',
        error,
        '\n------------------------',
      );
    });

    garden.on('success', (order, action, result) => {
      console.log(
        '\n------ SUCCESS EVENT ------',
        '\nOrder ID:',
        order.create_order.create_id,
        '\nAction:',
        action,
        '\nResult:',
        result,
        '\n--------------------------',
      );
    });

    garden.on('log', (id, message) => {
      console.log(
        '\n------ LOG EVENT ------',
        '\nOrder ID:',
        id,
        '\nMessage:',
        message,
        '\n----------------------',
      );
    });

    garden.on('onPendingOrdersChanged', (orders) => {
      console.log(
        '\n------ PENDING ORDERS ------',
        '\nCount:',
        orders.length,
        '\n--------------------------',
      );
    });

    garden.on('rbf', (order, result) => {
      console.log(
        '\n------ RBF EVENT ------',
        '\nOrder ID:',
        order.create_order.create_id,
        '\nResult:',
        result,
        '\n----------------------',
      );
    });
  };

  it('should create and execute a BTC-Starknet swap', async () => {
    console.log('\n------ CREATING SWAP ORDER ------');
    const order = {
      fromAsset: SupportedAssets.localnet.bitcoinRegtest,
      toAsset: SupportedAssets.localnet.starknet_localnet_STRK,
      sendAmount: '10000',
      receiveAmount: '10000',
      additionalData: {
        strategyId: 'brsd13',
        btcAddress: btcAddress,
      },
      minDestinationConfirmations: 1,
    };
    // console.log('Order Parameters:', JSON.stringify(order, null, 2));

    const result = await garden.swap(order);
    if (result.error) {
      console.log('\n------ SWAP ERROR ------');
      console.log('Error:', result.error);
      console.log('------------------------');
      throw new Error(result.error);
    }

    console.log('\n------ SWAP ORDER CREATED ------');
    console.log('Order Details:');
    console.log('- Order ID:', result.val.create_order.create_id);
    console.log('- Source Asset:', result.val.source_swap.asset);
    console.log('- Source Amount:', result.val.source_swap.amount);
    console.log('- Destination Asset:', result.val.destination_swap.asset);
    console.log('- Destination Amount:', result.val.destination_swap.amount);
    console.log('--------------------------------');

    console.log('\n------ ADDING FUNDS TO BTC WALLET------');
    await fund(await btcWallet.getAddress());

    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();

    console.log('\n------ FUNDING BITCOIN ------');
    try {
      console.log('Bitcoin Address:', await btcWallet.getAddress());

      // First, mine enough blocks to mature the coins
      console.log('Mining blocks to mature coins...');
      await mineBlock(await btcWallet.getAddress(), 101);
      console.log('Coins matured successfully');

      // Now proceed with the send
      await btcWallet.send(
        result.val.source_swap.swap_id,
        +result.val.source_swap.amount,
      );
      await mineBlock(await btcWallet.getAddress(), 3);
      console.log('HTLC Funding Success');
      console.log('Swap ID:', result.val.source_swap.swap_id);
      console.log('--------------------------------');
    } catch (error) {
      console.log('\n------ HTLC FUNDING ERROR ------');
      console.log('Error:', error);
      console.log('--------------------------------');
      throw error;
    }
  }, 60000);

  it('Execute orders', async () => {
    console.log('\n------ EXECUTING ORDERS ------');
    setupEventListeners();
    await garden.starknetExecute();
    console.log('Waiting for confirmations (150 seconds)...');
    await sleep(150000);
    console.log('------ EXECUTION COMPLETE ------\n');
  }, 150000);
});
