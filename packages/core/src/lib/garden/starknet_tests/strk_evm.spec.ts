import { Garden } from '../garden';
import { MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import {
  Environment,
  //  Siwe, Url,
  with0x,
} from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import { createWalletClient, http } from 'viem';
// import { EvmRelay, Quote } from '@gardenfi/core';
// import { StarknetRelay } from '../../starknet/relay/starknetRelay';
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

  // const RELAYER_URL = 'https://orderbook-stage.hashira.io';
  const STARKNET_NODE_URL =
    'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
  // const QUOTE_SERVER_URL = 'https://quote-staging.hashira.io';
  // const STARKNET_RELAY_URL = 'https://starknet-relayer.hashira.io';
  // const API_KEY =
  //   'AAAAAGm-kkU6Og9gRTmB1DP9oxyNi88Ttt1bARxzj-wTxG00LLYHUkhvMi1nwQzrxU1-kU2EQkCBw803q64Yw-j40vYxK7GBtDcb';

  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const STARKNET_PRIVATE_KEY =
    // '0x0440c893bd4cbc2c151d579c9d721eec4d316306f871368baa89033e3f6820b9';
    // '0x075e69744ff5a9b4bd942b918293118dfcffc768033caacb9a8b8b269be7b312';
    '0x03eb1a8fc77eac663580829c3cfc3c3f8d495f16366af1cf42a7f4460cfbcd97';
  const STARKNET_ADDRESS =
    // '0x0390cf09b3537e450170bdcce49a789facb727f21eabd8e1d25b8cf1869e8e93';
    // '0x03ff66cbb9d97c9042dead5ef61d4b1d6d452f99e28f24b079e3d08ef4b4c4f3';
    '0x035c50625822eab248eb63f9198a0e4bdd02627526a4edc47d89ce678fe47b16';
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

  // const garden = new Garden({
  //   api: RELAYER_URL,
  //   environment: Environment.TESTNET,
  //   digestKey: DIGEST_KEY,
  //   // quote: new Quote(QUOTE_SERVER_URL),
  //   htlc: {
  //     evm: new EvmRelay(
  //       RELAYER_URL,
  //       evmWallet,
  //       Siwe.fromDigestKey(new Url(RELAYER_URL), DIGEST_KEY),
  //     ),
  //     starknet: new StarknetRelay(STARKNET_RELAY_URL, starknetWallet),
  //   },
  // });
  const garden = Garden.from({
    environment: Environment.TESTNET,
    digestKey: DIGEST_KEY,
    wallets: {
      evm: evmWallet,
      starknet: starknetWallet,
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
      orders.forEach((order) => {
        console.log(
          'Order id :',
          order.create_order.create_id,
          'status :',
          order.status,
        );
      });
    });

    garden.on('rbf', (order, result) => {
      console.log('RBF:', order.create_order.create_id, result);
    });
  };
  let matchedOrder: MatchedOrder;

  //-----------------STRK-EVM SWAP-----------------

  describe('strk-evm swap', async () => {
    it('should create and execute a StarkNet-ETH swap', async () => {
      const order = {
        fromAsset: SupportedAssets.testnet.starknet_testnet_ETH,
        toAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
        sendAmount: '10000000000000000',
        receiveAmount: '22361',
        additionalData: {
          strategyId: 'ss59as1d',
        },
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
    }, 150000);

    it('Execute', async () => {
      setupEventListeners(garden);
      await garden.execute();
      await sleep(150000);
    }, 150000);
  });

  //-----------------EVM-STRK SWAP-----------------

  describe.only('evm-strk swap', async () => {
    it('should create order and match', async () => {
      const order = {
        fromAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
        toAsset: SupportedAssets.testnet.starknet_testnet_ETH,
        sendAmount: '500000',
        receiveAmount: '214821925172042749',
        additionalData: {
          strategyId: 'as1dss59',
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

  describe('btc-strk swap', async () => {
    it('should create order and match', async () => {
      console.log('\n------ CREATING SWAP ORDER ------');
      const order = {
        fromAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
        toAsset: SupportedAssets.testnet.starknet_testnet_ETH,
        sendAmount: '10000',
        receiveAmount: '4292202826399481',
        additionalData: {
          strategyId: 'btyrss59',
          btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
        },
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
      console.log('Initiate the swap: ', matchedOrder.source_swap.swap_id);
      expect(matchedOrder.source_swap.swap_id).toBeTruthy();
    }, 20000);

    it('Execute', async () => {
      setupEventListeners(garden);
      await garden.execute();
      await sleep(150000);
    }, 150000);
  });

  describe('strk-btc swap', async () => {
    it.skip('should create order and match', async () => {
      console.log('\n------ CREATING SWAP ORDER ------');
      const order = {
        fromAsset: SupportedAssets.testnet.starknet_testnet_ETH,
        toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
        sendAmount: '10000000000000000',
        receiveAmount: '23159',
        additionalData: {
          strategyId: 'ss59btyr',
          btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
        },
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

    it.skip('Initiate the swap', async () => {
      const res = await garden.starknetHTLC?.initiate(matchedOrder);
      console.log('initiated ✅ :', res?.val);
      if (res?.error) console.log('init error ❌ :', res.error);
      // expect(res.ok).toBeTruthy();
      expect(res?.ok).toBeTruthy();
    }, 20000);

    it.only('Execute', async () => {
      setupEventListeners(garden);
      await garden.execute();
      await sleep(150000);
    }, 150000);
  });
});
