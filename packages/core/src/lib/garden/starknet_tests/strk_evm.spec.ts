import { Garden } from '../garden';
import { Order, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, with0x, Network, sleep } from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { IGardenJS, SwapParams } from '../garden.types';
import { STARKNET_CONFIG } from './../../constants';
import * as anchor from '@coral-xyz/anchor';
import { web3 } from '@coral-xyz/anchor';

describe('StarkNet Integration Tests', () => {
  // Wallet configurations
  const EVM_PRIVATE_KEY = '';
  const STARKNET_PRIVATE_KEY = '';
  const STARKNET_ADDRESS = '';
  const DIGEST_KEY =
    '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';
  // const DIGEST_KEY = DigestKey.generateRandom().val;
  const TEST_RPC_URL = 'https://api.devnet.solana.com';
  const PRIV = [];
  const connection = new web3.Connection(TEST_RPC_URL, {
    commitment: 'confirmed',
  });
  const privateKeyBytes = new Uint8Array(PRIV);
  const user = web3.Keypair.fromSecretKey(privateKeyBytes);
  const userWallet = new anchor.Wallet(user);
  console.log('User:', user.publicKey.toString());
  const userProvider = new anchor.AnchorProvider(connection, userWallet);

  // Global variables
  const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
  const evmWallet = createWalletClient({
    account: evmAccount,
    chain: mainnet,
    transport: http(),
  });
  console.log('EVM Wallet Address:', evmWallet.account.address);
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
    digestKey: DIGEST_KEY!,
    apiKey: 'f242ea49332293424c96c562a6ef575a819908c878134dcb4fce424dc84ec796',
    wallets: {
      evm: evmWallet,
      starknet: starknetWallet,
      solana: userProvider,
    },
  }).handleSecretManagement(true);

  const setupEventListeners = (garden: IGardenJS) => {
    garden.on('error', (order, error) => {
      console.log(
        'Error while executing ❌, orderId:',
        order.order_id,
        'error:',
        error,
      );
    });

    garden.on('success', (order, action, result) => {
      console.log(
        'Executed ✅, orderId:',
        order.order_id,
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
        console.log('Order id :', order.order_id, 'status :', order.status);
      });
    });

    garden.on('rbf', (order, result) => {
      console.log('RBF:', order.order_id, result);
    });
  };
  let matchedOrder: Order;

  //-----------------STRK-EVM SWAP-----------------

  describe.only('strk-evm swap', async () => {
    it('should create and execute a StarkNet-ETH swap', async () => {
      const order: SwapParams = {
        fromAsset: {
          name: 'Wrapped Bitcoin',
          decimals: 8,
          symbol: 'USDT',
          chain: 'base_sepolia',
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          tokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
          atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
        },
        toAsset: {
          name: 'Starknet ETH',
          decimals: 8,
          symbol: 'WBTC',
          chain: 'starknet_sepolia',
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          tokenAddress:
            '0x496bef3ed20371382fbe0ca6a5a64252c5c848f9f1f0cccf8110fc4def912d5',
          atomicSwapAddress:
            '0x06579d255314109429a4477d89629bc2b94f529ae01979c2f8014f9246482603',
        },
        sendAmount: '25000000',
        receiveAmount: '992',
        additionalData: {
          btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
        },
      };
      const result = await garden.swap(order);
      if (!result.ok) {
        console.log('Error while creating order ❌:', result.error);
        throw new Error(result.error);
      }
      console.log('Order created and matched ✅', result.val.order_id);
      matchedOrder = result.val;
      expect(result.error).toBeFalsy();
      expect(result.val).toBeTruthy();
    }, 150000);

    // it('Initiate the swap', async () => {
    //   const res = await garden.evmHTLC?.initiate(matchedOrder);
    //   console.log('initiated ✅ :', res?.val);
    //   if (res?.error) console.log('init error ❌ :', res.error);
    //   expect(res?.ok).toBeTruthy();
    // }, 150000);

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
        toAsset: SupportedAssets.testnet.starknet_testnet_WBTC,
        sendAmount: '500000',
        receiveAmount: '214821925172042749',
        additionalData: {},
      };

      const result = await garden.swap(order);
      if (!result.ok) {
        console.log('Error while creating order ❌:', result.error);
        throw new Error(result.error);
      }

      console.log('Order created and matched✅', result.val.order_id);
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
      if (!res.ok) console.log('init error ❌ :', res.error);
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
        toAsset: SupportedAssets.testnet.starknet_testnet_WBTC,
        sendAmount: '10000',
        receiveAmount: '4292202826399481',
        additionalData: {
          strategyId: 'btyrss59',
          btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
        },
      };

      const result = await garden.swap(order);
      if (!result.ok) {
        console.log('Error while creating order ❌:', result.error);
        throw new Error(result.error);
      }

      console.log('Order created and matched✅', result.val.order_id);
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
        fromAsset: SupportedAssets.testnet.starknet_testnet_WBTC,
        toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
        sendAmount: '10000000000000000',
        receiveAmount: '23159',
        additionalData: {
          strategyId: 'ss59btyr',
          btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
        },
      };

      const result = await garden.swap(order);
      if (!result.ok) {
        console.log('Error while creating order ❌:', result.error);
        throw new Error(result.error);
      }

      console.log('Order created and matched✅', result.val.order_id);
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

    // it.only('Execute', async () => {
    //   setupEventListeners(garden);
    //   await garden.execute();
    //   await sleep(150000);
    // }, 150000);
  });
});
