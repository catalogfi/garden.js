import { Garden } from '../garden';
import { MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, Siwe, Url, with0x } from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import { createWalletClient, http } from 'viem';
import { EvmRelay, Quote } from '@gardenfi/core';
import { StarknetRelay } from '../../starknet/relay/starknetRelay';
import { arbitrumSepolia } from 'viem/chains';
import { IGardenJS } from '../garden.types';

// async function mineStarknetBlocks(blocks: number, rpcUrl: string) {
//   try {
//     for (let i = 0; i < blocks; i++) {
//       const response = await fetch(rpcUrl, {
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
//       await response.json(); // Wait for response
//       console.log(`Mined block ${i + 1}/${blocks}`);
//     }
//   } catch (error) {
//     console.error('Mining failed:', error);
//     throw error; // Propagate the error
//   }
// }

describe('StarkNet Integration Tests', () => {
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
  // const RELAYER_URL = 'https://orderbook.garden.finance';
  // const STARKNET_NODE_URL =
  //   'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/Ry6QmtzfnqANtpqP3kLqe08y80ZorPoY';
  // const QUOTE_SERVER_URL = 'https://price.garden.finance';
  // const STARKNET_RELAY_URL = 'https://starknet-relay.garden.finance';
  // const API_KEY =
  //   'AAAAAGm-kkU6Og9gRTmB1DP9oxyNi88Ttt1bARxzj-wTxG00LLYHUkhvMi1nwQzrxU1-kU2EQkCBw803q64Yw-j40vYxK7GBtDcb';

  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const STARKNET_PRIVATE_KEY =
    '0x0440c893bd4cbc2c151d579c9d721eec4d316306f871368baa89033e3f6820b9';
  const STARKNET_ADDRESS =
    '0x0390cf09b3537e450170bdcce49a789facb727f21eabd8e1d25b8cf1869e8e93';
  const DIGEST_KEY =
    '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';

  //   const STARKNET_PRIVATE_KEY =
  //     '0x00000000000000000000000000000000c10662b7b247c7cecf7e8a30726cff12';
  //   const STARKNET_ADDRESS =
  //     '0x0260a8311b4f1092db620b923e8d7d20e76dedcc615fb4b6fdf28315b81de201';

  // Global variables
  const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
  const evmWallet = createWalletClient({
    account: evmAccount,
    chain: arbitrumSepolia,
    transport: http(),
  });
  const snProvider = new RpcProvider({ nodeUrl: STARKNET_NODE_URL });
  const starknetWallet = new Account(
    snProvider,
    STARKNET_ADDRESS,
    STARKNET_PRIVATE_KEY,
    '1',
    '0x3',
  );

  const garden = new Garden({
    api: RELAYER_URL,
    environment: Environment.TESTNET,
    digestKey: DIGEST_KEY,
    quote: new Quote(QUOTE_SERVER_URL),
    htlc: {
      evm: new EvmRelay(
        RELAYER_URL,
        evmWallet,
        Siwe.fromDigestKey(new Url(RELAYER_URL), DIGEST_KEY),
      ),
      starknet: new StarknetRelay(
        STARKNET_RELAY_URL,
        starknetWallet,
        STARKNET_NODE_URL,
      ),
    },
  });

  const setupEventListeners = (garden: IGardenJS) => {
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
  let matchedOrder: MatchedOrder;

  //-----------------STRK-EVM SWAP-----------------

  describe.skip('strk-evm swap', async () => {
    it('should create and execute a StarkNet-ETH swap', async () => {
      const order = {
        fromAsset: SupportedAssets.testnet.starknet_testnet_ETH,
        toAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
        sendAmount: '100000000000000000',
        receiveAmount: '1000',
        additionalData: {
          strategyId: 'ssabasac',
        },
        minDestinationConfirmations: 1,
      };

      const result = await garden.swap(order);
      if (result.error) {
        console.log('Error while creating order ❌:', result.error);
        throw new Error(result.error);
      }

      console.log(
        'Order created and matched ✅',
        result.val.create_order.create_id,
      );
      matchedOrder = result.val;
      // console.log(result.val.source_swap.asset);
      // console.log('successfully initiated the swap ✅');
      // console.log('Mining Starknet blocks...');
      // await mineStarknetBlocks(3, STARKNET_NODE_URL);
      // console.log('Blocks mined successfully');

      expect(result.error).toBeFalsy();
      expect(result.val).toBeTruthy();
    }, 150000);

    it('Initiate the swap', async () => {
      const res = await garden.starknetHTLC?.initiate(matchedOrder);
      console.log('initiated ✅ :', res?.val);
      if (res?.error) console.log('init error ❌ :', res.error);
      // expect(res.ok).toBeTruthy();
      expect(res?.ok).toBeTruthy();
    }, 20000);

    it('Execute', async () => {
      setupEventListeners(garden);
      await garden.execute();
      await sleep(150000);
    }, 150000);
  });

  //-----------------EVM-STRK SWAP-----------------

  describe('evm-strk swap', async () => {
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
      matchedOrder = result.val;

      expect(result.error).toBeFalsy();
      expect(result.val).toBeTruthy();
    }, 150000);

    it('Initiate the swap', async () => {
      if (!garden.evmHTLC) {
        throw new Error('EVM HTLC is not initialized');
      }

      const res = await garden.evmHTLC.initiate(matchedOrder);
      console.log('initiated ✅ :', res.val);
      if (res.error) console.log('init error ❌ :', res.error);
      // expect(res.ok).toBeTruthy();
      expect(res.ok).toBeTruthy();
    }, 20000);

    it('Execute', async () => {
      setupEventListeners(garden);
      await garden.execute();
      await sleep(150000);
    }, 150000);
  });
});
