import { Garden } from '../garden';
import { Chains, MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, with0x, Network } from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import { createWalletClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { IGardenJS } from '../garden.types';
import { STARKNET_CONFIG } from './../../constants';

describe('StarkNet Integration Tests', () => {
  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const STARKNET_PRIVATE_KEY =
    '0x03eb1a8fc77eac663580829c3cfc3c3f8d495f16366af1cf42a7f4460cfbcd97';
  const STARKNET_ADDRESS =
    '0x035c50625822eab248eb63f9198a0e4bdd02627526a4edc47d89ce678fe47b16';
  const DIGEST_KEY =
    '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';

  // Global variables
  const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
  const evmWallet = createWalletClient({
    account: evmAccount,
    chain: arbitrumSepolia,
    transport: http(),
  });
  const snProvider = new RpcProvider({
    nodeUrl: STARKNET_CONFIG[Network.TESTNET].nodeUrl,
  });
  const starknetWallet = new Account(
    snProvider,
    STARKNET_ADDRESS,
    STARKNET_PRIVATE_KEY,
    '1',
    '0x3',
  );

  const garden = Garden.fromWallets({
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

  describe.only('strk-evm swap', async () => {
    it('should create and execute a StarkNet-ETH swap', async () => {
      const order = {
        fromAsset: {
          name: 'Starknet ETH',
          decimals: 18,
          symbol: 'ETH',
          chain: Chains.starknet_sepolia,
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          tokenAddress:
            '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
          atomicSwapAddress:
            '0x75cf614ce4ebce29ac622a50cd5151ddfff853159707589a85dd67b9fb1eba',
        },
        toAsset: {
          name: 'Wrapped Bitcoin',
          decimals: 8,
          symbol: 'WBTC',
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          chain: Chains.arbitrum_sepolia,
          tokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
          atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
        },
        sendAmount: '10000000000000000',
        receiveAmount: '19234',
        additionalData: {
          strategyId: 'ssabasac',
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

      expect(result.error).toBeFalsy();
      expect(result.val).toBeTruthy();
    }, 150000);

    it('Initiate the swap', async () => {
      const res = await garden.starknetHTLC?.initiate(matchedOrder);
      console.log('initiated ✅ :', res?.val);
      if (res?.error) console.log('init error ❌ :', res.error);
      expect(res?.ok).toBeTruthy();
    }, 150000);

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
