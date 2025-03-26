import { Garden } from '../garden';
import { MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, with0x } from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { beforeAll, describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
// import axios from 'axios';
import { Quote } from '@gardenfi/core';
import { StarknetRelay } from '../../starknet/relay/starknetRelay';
// import { promisify } from 'util';
// import { exec } from 'child_process';

// const execAsync = promisify(exec);

// const RPC_USER = 'admin1';
// const RPC_PASSWORD = '123';

// async function mineBlock(addr: string, count: number): Promise<void> {
//   try {
//     const { data: mineData } = await axios.post(
//       'http://localhost:18443',
//       {
//         jsonrpc: '1.0',
//         id: 'generatetoaddress',
//         method: 'generatetoaddress',
//         params: [count, addr],
//       },
//       {
//         auth: {
//           username: RPC_USER,
//           password: RPC_PASSWORD,
//         },
//       },
//     );
//     return mineData;
//   } catch (error) {
//     console.log('Mining failed : ', error);
//   }
// }

// async function fund(addr: string): Promise<void> {
//   try {
//     await execAsync(`merry faucet --to ${addr}`);
//   } catch (error) {
//     console.log('Funding failed : ', error);
//   }
// }
// async function mineStarknetBlocks(blocks: number, rpcUrl: string) {
//   try {
//     for (let i = 0; i < blocks; i++) {
//       await fetch(rpcUrl, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           jsonrpc: '2.0',
//           id: '1',
//           method: 'devnet_createBlock',
//         }),
//       });
//     }
//   } catch (error) {
//     console.log('Mining failed : ', error);
//   }
// }

describe('StarkNet Integration Tests - STRK -> BTC', () => {
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
  let starknetWallet: Account;
  let btcAddress: string;
  let btcWallet: BitcoinWallet;

  beforeAll(async () => {
    // Initialize EVM wallet
    const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
    console.log('Ethereum account address:', evmAccount.address);

    // Initialize StarkNet wallet
    const snProvider = new RpcProvider({ nodeUrl: STARKNET_NODE_URL });
    starknetWallet = new Account(
      snProvider,
      STARKNET_ADDRESS,
      STARKNET_PRIVATE_KEY,
    );
    console.log('StarkNet account address:', starknetWallet.address);

    // const bitcoinProvider = new BitcoinProvider(
    //   BitcoinNetwork.Regtest,
    //   'http://localhost:30000',
    // );
    const bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Testnet,
      'https://48.217.250.147:18443',
    );

    btcWallet = BitcoinWallet.fromPrivateKey(
      'af530c3d2212740a8428193fce82bfddcf7e83bee29a2b9b2f25b5331bae1bf5',
      bitcoinProvider,
      { pkType: 'p2wpkh', pkPath: "m/84'/0'/0'/0/0" },
    );

    btcAddress = await btcWallet.getAddress();
    console.log('Bitcoin wallet address:', btcAddress);

    // Initialize Garden
    garden = new Garden({
      api: RELAYER_URL,
      environment: Environment.TESTNET,
      digestKey:
        '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
      quote: new Quote(QUOTE_SERVER_URL),
      htlc: {
        starknet: new StarknetRelay(STARKNET_RELAY_URL, starknetWallet),
      },
    });
  }, 5000000);
  let matchedorder: MatchedOrder;

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
  it('should create and execute a Starknet-BTC swap', async () => {
    const order = {
      fromAsset: SupportedAssets.testnet.starknet_testnet_ETH,
      toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
      sendAmount: '100000000000000000',
      receiveAmount: '100000',
      additionalData: {
        strategyId: 'ssabbtyr',
        btcAddress: btcAddress,
      },
      minDestinationConfirmations: 1,
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
    // console.log('Order details:', {
    //   orderId: result.val.create_order.create_id,
    //   sourceAsset: result.val.source_swap.asset,
    //   sourceAmount: result.val.source_swap.amount,
    //   destinationAsset: result.val.destination_swap.asset,
    //   destinationAmount: result.val.destination_swap.amount,
    // });
    matchedorder = result.val;
    // console.log('Mining Starknet blocks...');
    // await mineStarknetBlocks(3, STARKNET_NODE_URL);
    // console.log('Blocks mined successfully');

    // await sleep(10000);

    // console.log('Mining Bitcoin blocks...');
    // await mineBlock(await btcWallet.getAddress(), 3);
    // console.log('Bitcoin blocks mined successfully');

    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();
  }, 150000);

  it('Initiate the swap', async () => {
    const res = await garden.starknetHTLC?.initiate(matchedorder);
    console.log('initiated ✅ :', res?.val);
    if (res?.error) console.log('init error ❌ :', res.error);
    // expect(res.ok).toBeTruthy();
    expect(res?.ok).toBeTruthy();
  }, 20000);

  it('Execute', async () => {
    setupEventListeners();
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
