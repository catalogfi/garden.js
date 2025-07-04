import { Garden } from '../garden';
import { Chains, MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, with0x, Network, DigestKey } from '@gardenfi/utils';
import { RpcProvider, Account } from 'starknet';
import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import { createWalletClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { IGardenJS, SwapParams } from '../garden.types';
import { STARKNET_CONFIG } from './../../constants';

describe('StarkNet Integration Tests', () => {
  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const STARKNET_PRIVATE_KEY =
    '0x03eb1a8fc77eac663580829c3cfc3c3f8d495f16366af1cf42a7f4460cfbcd97';
  const STARKNET_ADDRESS =
    '0x035c50625822eab248eb63f9198a0e4bdd02627526a4edc47d89ce678fe47b16';
  // const DIGEST_KEY =
  //   '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';
  const DIGEST_KEY = DigestKey.generateRandom().val;

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
    digestKey: DIGEST_KEY!,
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
      // const quoteRes = await garden.quote.getQuote(
      //   'ethereum_sepolia:0x29C9C37D0Fec7E64AFab0f806c8049d9e2f9B0b6::arbitrum_sepolia:0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      //   100000,
      //   false,
      //   {
      //     affiliateFee: 30,
      //   },
      // );
      // console.log('Quote :', quoteRes.val);
      // console.log('Quote :', quoteRes.error);
      // console.log('now running attested quote');
      // const attId: CreateOrderReqWithStrategyId = {
      //   source_chain: 'arbitrum_sepolia',
      //   destination_chain: 'starknet_sepolia',
      //   source_asset: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      //   destination_asset:
      //     '0x2448040b22b27f5a814756e67da005701e525658b162d4f0343d2e011bc6dad',
      //   initiator_source_address: '0x004Cc75ACF4132Fc08cB6a252E767804F303F729',
      //   initiator_destination_address:
      //     '0x004Cc75ACF4132Fc08cB6a252E767804F303F729',
      //   source_amount: '10000',
      //   destination_amount: '9920',
      //   fee: '1',
      //   nonce: '1745237807667',
      //   timelock: 7200,
      //   secret_hash:
      //     '3bc8a2174da66a351ec0342003e537c8f87ab910b0c9f096962fc77acc7a2a47',
      //   min_destination_confirmations: 0,
      //   integrator_fees: [
      //     {
      //       address: '0x004Cc75ACF4132Fc08cB6a252E767804F303F729',
      //       chain: 'arbitrum_sepolia',
      //       asset: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      //       fee: 30,
      //     },
      //     {
      //       address: '0x004Cc75ACF4132Fc08cB6a252E767804F303F729',
      //       chain: 'arbitrum_sepolia',
      //       asset: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      //       fee: 20,
      //     },
      //   ],
      //   additional_data: {
      //     strategy_id: 'ssabasae',
      //   },
      // };

      // const attRes = await garden.quote.getAttestedQuote(attId);
      // console.log('Attested Quote :', attRes.val);
      // console.log('Attested Quote :', attRes.error);

      // console.log("now it's time to create order");
      // const createRes = await garden.orderbook.createOrder(attRes.val, auth);
      // console.log('Order created :', createRes.val);
      // console.log('Order created :', createRes.error);
      const order: SwapParams = {
        fromAsset: {
          name: 'Starknet ETH',
          decimals: 8,
          symbol: 'WBTC',
          chain: Chains.ethereum_sepolia,
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          tokenAddress: '0x4D68da063577F98C55166c7AF6955cF58a97b20A',
          atomicSwapAddress: '0x3C6a17b8cD92976D1D91E491c93c98cd81998265',
        },
        toAsset: {
          name: 'Wrapped Bitcoin',
          decimals: 8,
          symbol: 'WBTC',
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          chain: Chains.arbitrum_sepolia,
          tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
          atomicSwapAddress: '0xE918A5a47b8e0AFAC2382bC5D1e981613e63fB07',
        },
        sendAmount: '100000',
        receiveAmount: '99200',
        additionalData: {
          strategyId: 'ea56aa70',
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
      const res = await garden.evmHTLC?.initiate(matchedOrder);
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
        toAsset: SupportedAssets.testnet.starknet_testnet_WBTC,
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
        toAsset: SupportedAssets.testnet.starknet_testnet_WBTC,
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

    // it.only('Execute', async () => {
    //   setupEventListeners(garden);
    //   await garden.execute();
    //   await sleep(150000);
    // }, 150000);
  });
});
