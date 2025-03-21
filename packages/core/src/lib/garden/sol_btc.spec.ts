//@ts-nocheck
import { Garden } from './garden';
import * as anchor from '@coral-xyz/anchor';
import { Environment, with0x } from '@gardenfi/utils';
import { createWalletClient, http } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ArbitrumLocalnet,
  // EthereumLocalnet,
  MatchedOrder,
  SupportedAssets,
} from '@gardenfi/orderbook';
import { web3 } from '@coral-xyz/anchor';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockNumberFetcher } from '../blockNumberFetcher/blockNumber';
// import { sepolia } from 'viem/chains';
import { sleep } from '@catalogfi/utils';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
// import { BitcoinNetwork, BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';

// describe('==========SOL <--> BTC===========', () => {
//     // Test configuration
//     const TEST_RPC_URL = "http://localhost:8899";
//     const TEST_RELAY_URL = new URL("http://localhost:5014/relay");
//     const TEST_SWAPPER_RELAYER = "http://localhost:4426";

//     // Solana setup
//     const user = new web3.Keypair();
//     const connection = new web3.Connection(TEST_RPC_URL, { commitment: "confirmed" });
//     const userWallet = new anchor.Wallet(user);
//     const userProvider = new anchor.AnchorProvider(connection, userWallet);

//     let BTC_ADDRESS: string;

// const bitcoinProvider = new BitcoinProvider(
//     BitcoinNetwork.Regtest,
//     'https://indexer.merry.dev'
// );

// const btcWallet = BitcoinWallet.createRandom(bitcoinProvider);

//     // Fund SOL wallet
//     beforeAll(async () => {
//         console.log("Airdropping 10 SOL to the user for testing");
//         const signature = await connection.requestAirdrop(userProvider.publicKey, web3.LAMPORTS_PER_SOL * 10);
//         await connection.confirmTransaction({ signature, ...(await connection.getLatestBlockhash()) });
//         console.log("Airdrop Success");

//         console.log("Geting bitcoin address")
//         BTC_ADDRESS = await btcWallet.getAddress();
//     });

//     // EVM setup
//     const pk = '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
//     const account = privateKeyToAccount(with0x(pk));
//     console.log('account :', account.address);

//     const arbitrumWalletClient = createWalletClient({
//         account,
//         chain: EthereumLocalnet,
//         transport: http(),
//     });

//     // Garden setup
//     const garden = new Garden({
//         environment: Environment.TESTNET,
//         solWallet: userProvider,
//         solanaRelayUrl: TEST_RELAY_URL,
//         evmWallet: arbitrumWalletClient,
//         orderbookURl: TEST_SWAPPER_RELAYER,
//         btcWallet: btcWallet,
//         solanaRelayerAddress: "AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9",
//         blockNumberFetcher: new BlockNumberFetcher("http://localhost:3008", Environment.LOCALNET),
//         apiKey: "AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c"
//     });

//     let order: MatchedOrder;

//     // Setup event listeners
//     const setupEventListeners = () => {
//         garden.on('error', (order, error) => {
//             console.log('Error while executing ❌, orderId:', order.create_order.create_id, 'error:', error);
//         });
//         garden.on('success', (order, action, result) => {
//             console.log('Executed ✅, orderId:', order.create_order.create_id, 'action:', action, 'result:', result);
//         });
//         garden.on('log', (id, message) => {
//             console.log('Log:', id, message);
//         });
//         garden.on('onPendingOrdersChanged', (orders) => {
//             console.log('Pending orders:', orders.length);
//             orders.forEach((order) => {
//                 console.log('Pending order:', order.create_order.create_id);
//             });
//         });
//         garden.on('rbf', (order, result) => {
//             console.log('RBF:', order.create_order.create_id, result);
//         });
//     };

//     // SOL -> BTC test
//     it('SOL -> BTC: create and match', async () => {
//         const orderObj = {
//             fromAsset: SupportedAssets.localnet.solana_localnet_SOL,
//             toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
//             sendAmount: "20010",
//             receiveAmount: "2000",
//             additionalData: {
//                 strategyId: "sl4sbrbc",
//                 btcAddress: BTC_ADDRESS,
//             },
//             minDestinationConfirmations: 3,
//         };

//         const result = await garden.swap(orderObj);
//         if (result.error) {
//             console.log('Error while creating order ❌:', result.error);
//             throw new Error(result.error);
//         }

//         order = result.val;
//         console.log('Order created and matched✅', order.create_order.create_id);

//         expect(result.error).toBeFalsy();
//         expect(result.val).toBeTruthy();

//     }, 60000);

//     it('Execute orders', async () => {
//         setupEventListeners();
//         await garden.execute();
//         await sleep(150000);
//     }, 150000);
// });

describe('==========BTC <--> SOL===========', () => {
  // Test configuration
  const TEST_RPC_URL = 'http://localhost:8899';
  const TEST_RELAY_URL = new URL('http://localhost:5014/relay');
  const TEST_SWAPPER_RELAYER = 'http://localhost:4426';
  let BTC_ADDRESS: string;

  const bitcoinProvider = new BitcoinProvider(
    BitcoinNetwork.Regtest,
    'http://localhost:30000',
  );

  const btcWallet = BitcoinWallet.fromPrivateKey(
    '3cd7c7cd08c2eb6aeac37e5654a05ebc2e92afe0adf109ea0c615c7cb8d9831f',
    bitcoinProvider,
  );

  // Solana setup
  const user = new web3.Keypair();
  const connection = new web3.Connection(TEST_RPC_URL, {
    commitment: 'confirmed',
  });
  const userProvider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(user),
  );

  async function fundBTC(to: string): Promise<void> {
    const payload = JSON.stringify({
      address: to,
    });

    const res = await fetch('http://127.0.0.1:3000/faucet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    const data = await res.text();

    if (!res.ok) {
      throw new Error(data);
    }

    const dat: { txId?: string } = JSON.parse(data);

    if (!dat.txId) {
      throw new Error('Not successful');
    }

    console.log(
      'Successfully submitted at http://localhost:5050/tx/' + dat.txId,
    );
  }

  // Fund SOL wallet
  beforeAll(async () => {
    console.log('Airdropping 10 SOL to the user for testing');
    const signature = await connection.requestAirdrop(
      userProvider.publicKey,
      web3.LAMPORTS_PER_SOL * 10,
    );
    await connection.confirmTransaction({
      signature,
      ...(await connection.getLatestBlockhash()),
    });
    console.log('Airdrop Success');

    BTC_ADDRESS = await btcWallet.getAddress();
    console.log('BTC Address:: ', BTC_ADDRESS);

    console.log('Funding it now...');
    await fundBTC(BTC_ADDRESS);
    console.log('Funded successfully');
  });

  // EVM setup
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const account = privateKeyToAccount(with0x(pk));
  console.log('account :', account.address);

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: ArbitrumLocalnet,
    transport: http(),
  });

  // Garden setup
  const garden = new Garden({
    environment: Environment.TESTNET,
    solWallet: userProvider,
    solanaRelayUrl: TEST_RELAY_URL,
    evmWallet: arbitrumWalletClient,
    orderbookURl: TEST_SWAPPER_RELAYER,
    solanaRelayerAddress: 'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9',
    blockNumberFetcher: new BlockNumberFetcher(
      'http://localhost:3008',
      Environment.LOCALNET,
    ),
    apiKey:
      'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c',
  });

  let order: MatchedOrder;

  // Setup event listeners
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

  // SOL -> BTC test
  it('BTC -> SOL: create and match', async () => {
    const orderObj = {
      fromAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
      toAsset: SupportedAssets.localnet.solana_localnet_SOL,
      sendAmount: '10000',
      receiveAmount: '10000',
      additionalData: {
        strategyId: 'brbcsl4s',
        btcAddress: BTC_ADDRESS,
      },
      minDestinationConfirmations: 3,
    };

    const result = await garden.swap(orderObj);
    if (result.error) {
      console.log('Error while creating order ❌:', result.error);
      throw new Error(result.error);
    }

    order = result.val;
    console.log('Order created and matched✅', order.create_order.create_id);

    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();
  }, 60000);

  it('Send to HTLC', async () => {
    try {
      console.log('btcAddr ', (await btcWallet.getAddress()).toString());
      await btcWallet.send(
        order.source_swap.swap_id,
        +order.source_swap.amount,
      );
      console.log('HTLC Funded succesfully::', order.source_swap.swap_id);
    } catch (e) {
      console.log('Error funding HTLC ', e);
    }
  });

  it('Execute orders', async () => {
    setupEventListeners();
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
