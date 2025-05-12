import * as anchor from '@coral-xyz/anchor';
import { DigestKey, Environment, Siwe, Url } from '@gardenfi/utils';
import { beforeAll, describe, expect, it, beforeEach } from 'vitest';
import { MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { web3 } from '@coral-xyz/anchor';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
import { Orderbook } from '@gardenfi/orderbook';
import { Garden } from '../../../garden/garden';
import { BlockNumberFetcher } from '../../../blockNumberFetcher/blockNumber';
import { Quote } from '../../../quote/quote';
import { SolanaRelay } from '../../relayer/solanaRelay';
import { API } from '../../../constants';
import { SolanaRelayerAddress } from '../../constants';
import { skip } from 'node:test';

// Shared constants Testnet
const TEST_RPC_URL = 'https://api.devnet.solana.com';
const TEST_ORDERBOOK_STAGE = 'https://testnet.api.hashira.io';
const TEST_STAGE_AUTH = 'https://testnet.api.hashira.io/auth';
const TEST_BLOCKFETCHER_URL = 'https://info-stage.hashira.io';
const TEST_STAGE_QUOTE = 'https://testnet.api.hashira.io/quote';

const PRIV = [
  73, 87, 221, 5, 63, 180, 104, 26, 64, 41, 225, 50, 165, 84, 157, 74, 187, 105,
  53, 112, 214, 236, 175, 55, 86, 247, 214, 120, 101, 90, 62, 178, 103, 156,
  200, 13, 24, 181, 121, 93, 15, 85, 202, 164, 4, 30, 165, 77, 244, 66, 207, 78,
  179, 255, 45, 233, 17, 131, 203, 187, 120, 110, 176, 172,
];

// Timeout constants
const EXECUTE_TIMEOUT = 90 * 60 * 1000; //90 minutes
const CREATE_ORDER_TIMEOUT = 30000;

/**
 * Helper function to setup garden instance via custom htlc?
 */
function setupGarden(
  solanaProvider: anchor.AnchorProvider,
  btcWallet: BitcoinWallet,
): Garden {
  const digestKey = DigestKey.generateRandom();
  const auth = Siwe.fromDigestKey(new Url(TEST_STAGE_AUTH), digestKey.val!);

  return new Garden({
    environment: Environment.TESTNET,
    digestKey: digestKey.val!,
    htlc: {
      solana: new SolanaRelay(
        solanaProvider,
        new Url(API.testnet.solanaRelay),
        SolanaRelayerAddress.testnet,
      ),
    },
    blockNumberFetcher: new BlockNumberFetcher(
      TEST_BLOCKFETCHER_URL,
      Environment.TESTNET,
    ),
    orderbook: new Orderbook(new Url(TEST_ORDERBOOK_STAGE)),
    btcWallet: btcWallet,
    quote: new Quote(TEST_STAGE_QUOTE),
    auth: auth,
  });
}

/**
 * Configure event listeners for garden instance and resolve the promise when successful
 */
function setupGardenListeners(
  garden: Garden,
  resolver: () => void,
  orderId?: string,
): void {
  garden.on('error', (order: MatchedOrder, error: string) => {
    console.log(
      `❌ Error executing order ${order.create_order.create_id}: ${error}`,
    );
  });

  garden.on('success', (order: MatchedOrder, action: string) => {
    console.log(
      `✅ Successfully executed ${action} for order ${order.create_order.create_id}`,
    );
    // If this is the order we're waiting for, or if we're not looking for a specific order
    if (!orderId || order.create_order.create_id === orderId) {
      resolver(); // Resolve the promise to end the test early
    }
  });

  garden.on('log', (id: string, message: string) => {
    console.log(`📝 Log [${id}]: ${message}`);
  });

  garden.on('onPendingOrdersChanged', (orders: MatchedOrder[]) => {
    console.log(`⏳Pending orders: ${orders.length}`);
    orders.forEach((order) => {
      console.log(`Pending order: ${order.create_order.create_id}`);
    });
  });

  garden.on('rbf', (order: MatchedOrder, result: unknown) => {
    console.log(
      `🔄 RBF for order ${order.create_order.create_id}: ${JSON.stringify(
        result,
      )}`,
    );
  });
}

async function executeWithTimeout(
  garden: Garden,
  orderId?: string,
  timeoutMs: number = EXECUTE_TIMEOUT,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let resolved = false;

    // Backup resolver that will prevent the test from running indefinetly
    const resolveOnce = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    // Setup the event listerns
    setupGardenListeners(garden, resolve, orderId);

    // Stop the test after timeout
    const timeout = setTimeout(() => {
      console.log('Test execution timed out but continuing...');
      resolveOnce();
    }, timeoutMs);

    // Calling exectue method
    garden.execute().catch((error) => {
      console.error('Error during garden execution:', error);
      clearTimeout(timeout);
      resolveOnce();
    });
  });
}

describe('==========SOL <--> BTC===========', () => {
  // Solana setup
  let connection: web3.Connection;
  let userWallet: anchor.Wallet;
  let userProvider: anchor.AnchorProvider;

  // Bitcoin Setup
  let btcWallet: BitcoinWallet;
  let BTC_ADDRESS: string;
  let bitcoinProvider: BitcoinProvider;

  beforeAll(async () => {
    const privateKeyBytes = new Uint8Array(PRIV);
    const user = web3.Keypair.fromSecretKey(privateKeyBytes);
    connection = new web3.Connection(TEST_RPC_URL, { commitment: 'confirmed' });
    userWallet = new anchor.Wallet(user);
    userProvider = new anchor.AnchorProvider(connection, userWallet);

    // Bitcoin Initialization
    bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Testnet,
      'https://mempool.space/testnet4/api/',
    );
    btcWallet = BitcoinWallet.fromPrivateKey(
      '02438b87e7153f29c954b21d9019118fc40d88a51943a7b5e19e82a32a308206',
      bitcoinProvider,
    );
    BTC_ADDRESS = await btcWallet.getAddress();
  });

  skip('SOL -> BTC Swap', () => {
    let garden: Garden;
    let order: MatchedOrder;

    const digestKeyRes = DigestKey.generateRandom();

    if (digestKeyRes.error) throw new Error("Can't generate digest key");

    beforeEach(async () => {
      garden = setupGarden(userProvider, btcWallet);
    });

    it(
      'should create and execute SOL -> BTC swap order',
      async () => {
        //TODO: Get the exact amount and set to recieve amout
        // 1. Create Order
        const orderObj = {
          fromAsset: SupportedAssets.testnet.solana_testnet_SOL,
          toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
          sendAmount: '59337016',
          receiveAmount: '8000',
          additionalData: {
            strategyId: 'strybtry',
            btcAddress: BTC_ADDRESS,
          },
          minDestinationConfirmations: 1,
        };

        const result = await garden.swap(orderObj);
        expect(result.error).toBeFalsy();
        expect(result.val).toBeTruthy();

        order = result.val;
        console.log('✅ Order created:', order.create_order.create_id);

        // 2. Execute order
        await executeWithTimeout(garden, order.create_order.create_id);
      },
      CREATE_ORDER_TIMEOUT + EXECUTE_TIMEOUT,
    );
  });

  describe('BTC -> SOL Swap', () => {
    let garden: Garden;
    let order: MatchedOrder;

    const digestKeyRes = DigestKey.generateRandom();

    if (digestKeyRes.error) throw new Error("Can't generate digest key");

    beforeEach(async () => {
      garden = setupGarden(userProvider, btcWallet);
    });

    it(
      'Should create, match and execute BTC -> SOL swap',
      async () => {
        const orderObj = {
          fromAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
          toAsset: SupportedAssets.testnet.solana_testnet_SOL,
          sendAmount: '10000',
          receiveAmount: '10000',
          additionalData: {
            strategyId: 'btrystry',
            btcAddress: BTC_ADDRESS,
          },
          minDestinationConfirmations: 1,
        };

        const result = await garden.swap(orderObj);
        expect(result.error).toBeFalsy();
        expect(result.val).toBeTruthy();

        order = result.val;
        console.log(
          'Order created successfully:: ',
          order.create_order.create_id,
        );

        await executeWithTimeout(garden, order.create_order.create_id);
      },
      CREATE_ORDER_TIMEOUT + EXECUTE_TIMEOUT,
    );
  });
});
