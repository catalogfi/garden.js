import { Garden } from './garden';
import { Environment, with0x } from '@gardenfi/utils';
import {
  createWalletClient,
  http,
  // WalletClient
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import {
  // Chain,
  // Chains,
  isBitcoin,
  MatchedOrder,
  SupportedAssets,

  // SupportedAssets,
} from '@gardenfi/orderbook';
import { sleep } from '@catalogfi/utils';
import {
  arbitrumSepolia,
  sepolia,
  // arbitrumSepolia,
  // sepolia
} from 'viem/chains';
// import { EvmRelay } from './../evm/relay/evmRelay';
import { DigestKey } from '@gardenfi/utils';
import { switchOrAddNetwork } from '../switchOrAddNetwork';
import { SwapParams } from './garden.types';
// import { SecretManager } from '../secretManager/secretManager';
// import { DigestKey } from './digestKey/digestKey';
// import { BitcoinNetwork, BitcoinProvider } from '@catalogfi/wallets';
// import { Quote } from './../quote/quote';
// import { Orderbook } from 'gardenfi/orderbook';

describe.only('checking garden initialisation', async () => {
  const pk = '8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  // const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
  const account = privateKeyToAccount(with0x(pk));
  // const digestKey = new DigestKey(
  //   '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
  // );
  // const authurl = 'https://testnet.api.hashira.io/auth';
  // const url = 'https://testnet.api.hashira.io/relayer';
  // const api = 'https://orderbook-stage.hashira.io';

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  // const garden = new Garden({
  //   environment: {
  //     environment: Environment.TESTNET,
  //     orderbook: 'https://testnet.api.hashira.io',
  //   },
  //   digestKey,
  //   htlc: {
  //     evm: new EvmRelay(
  //       url,
  //       arbitrumWalletClient,
  //       Siwe.fromDigestKey(new Url(authurl), digestKey),
  //     ),
  //   },
  // });
  const garden = Garden.fromWallets({
    environment: {
      environment: Environment.TESTNET,
      orderbook: 'https://api.garden.finance',
    },
    digestKey:
      '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
    wallets: {
      evm: arbitrumWalletClient,
    },
  });

  console.log('garden :', garden);
  const order = await garden.orderbook.getOrder(
    'df4d18a3f4d8754d17c831b491b375f8b925625fa8b389b4b671325a66bdc176',
    true,
  );
  console.log('this is an order fetched', order.val);
});

describe('swap and execute using garden', () => {
  // const bitcoinAddress = 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru';
  const pk = '8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  // const address = '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000';
  const account = privateKeyToAccount(with0x(pk));
  const api = 'https://orderbook-v2-staging.hashira.io';
  console.log('account :', account.address);

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });
  // const ethereumWalletClient = createWalletClient({
  //   account,
  //   chain: sepolia,
  //   transport: http(),
  // });

  // const quote = new Quote('https://quote-choas.onrender.com/');
  // const orderBookUrl = 'https://evm-swapper-relay-1.onrender.com/';
  // const evmHTLC = new EvmRelay(
  //   'https://evm-swapper-relay-1.onrender.com/',
  //   arbitrumWalletClient,
  //   new Siwe({
  //     domain: 'evm-swapper-relay-1.onrender.com',
  //     nonce: '1',
  //   }),
  // );

  const digestKey = new DigestKey(
    '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
  );
  console.log('digestKey :', digestKey.userId);

  const garden = Garden.fromWallets({
    environment: Environment.TESTNET,
    digestKey:
      '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
    quote: new Quote('https://testnet.api.hashira.io'),
    htlc: {
      evm: new EvmRelay(
        api,
        arbitrumWalletClient,
        Siwe.fromDigestKey(
          new Url(api),
          '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
        ),
      ),
    },
  });

  it.skip('initialize garden from wallets', async () => {
    Garden.fromWallets({
      environment: Environment.TESTNET,
      digestKey:
        '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
      wallets: {
        evm: arbitrumWalletClient,
      },
    });
  });

  let order: MatchedOrder;

  it('should create an order', async () => {
    // const orderObj = {
    //   fromAsset: {
    //     name: 'Wrapped Bitcoin',
    //     decimals: 8,
    //     symbol: 'WBTC',
    //     chain: 'arbitrum_sepolia',
    //     logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
    //     tokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
    //     atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
    //   } as const,
    //   toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
    //   sendAmount: '100000'.toString(),
    //   receiveAmount: '99700'.toString(),
    //   additionalData: {
    //     strategyId: 'asacbtyr',
    //     btcAddress: 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru',
    //   },
    // };
    const orderObj = {
      fromAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
      toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
      sendAmount: '10000'.toString(),
      receiveAmount: '9970'.toString(),
      additionalData: {
        strategyId: 'ambcbnyr',
        btcAddress: 'bc1qxtztdl8qn24axe7dnvp75xgcns6pl5ka0depc0',
      },
    };

    const result = await garden.swap(orderObj);
    if (result.error) {
      console.log('error while creating order ❌ :', result.error);
      throw new Error(result.error);
    }

    order = result.val;
    console.log('orderCreated and matched ✅ ', order.create_order.create_id);
    if (!order) {
      throw new Error('Order id not found');
    }

    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();
  }, 60000);

  //TODO: also add bitcoin init
  it('Initiate the swap', async () => {
    if (isBitcoin(order.source_swap.chain)) {
      console.warn('Bitcoin swap, skipping initiation');
    }
    if (!garden.evmHTLC) {
      console.warn('EVMHTLC is not initialized, skipping initiation');
      return;
    }

    const res = await garden.evmHTLC.initiate(order);
    console.log('initiated ✅ :', res.val);
    if (res.error) console.log('init error ❌ :', res.error);
    expect(res.ok).toBeTruthy();
  }, 20000);

  it('EXECUTE', async () => {
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
    await garden.execute();
    await sleep(150000);
  }, 150000);
});

describe('switch network with http transport', () => {
  const evmAccount = privateKeyToAccount(
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61',
  );
  const executeStrategy = async (garden: Garden) => {
    const strategies = (await garden.quote.getStrategies()).val;
    const strategyKeys = Object.keys(strategies);
    const randomKey =
      strategyKeys[Math.floor(Math.random() * strategyKeys.length)];
    const strategy = strategies[randomKey];

    return { strategy, randomKey };
  };
  const getAssetByAtomicSwapAddress = (
    chain: string,
    atomicSwapAddress: string,
  ) => {
    const testnetAssets = SupportedAssets.testnet;
    const assetEntries = Object.entries(testnetAssets);

    const matchingAssetEntry = assetEntries.find(
      ([, asset]) =>
        asset.atomicSwapAddress.toLowerCase() ===
          atomicSwapAddress.toLowerCase() &&
        asset.chain === chain.toLowerCase(),
    );

    if (!matchingAssetEntry) {
      console.log(
        `No asset found with china: ${chain} and atomic swap address: ${atomicSwapAddress}`,
      );
      return;
    }

    return matchingAssetEntry[1];
  };
  const trade = async (garden: Garden) => {
    for (let i = 0; i < 10; i++) {
      const { strategy, randomKey } = await executeStrategy(garden);
      const quote = (
        await garden.quote.getQuote(
          randomKey,
          Number(strategy.minAmount),
          false,
        )
      ).val;
      const [sourceChainAndAsset, destChainAndAsset] = randomKey.split('::');
      const [sourceChain, sourceAsset] = sourceChainAndAsset.split(':');
      const [destChain, destAsset] = destChainAndAsset.split(':');
      if (
        sourceChain.includes('bitcoin') ||
        sourceChain.includes('starknet') ||
        destChain.includes('bitcoin') ||
        destChain.includes('starknet')
      ) {
        console.log('Stopping non-evm trade');
        continue;
      }
      const fromAsset = getAssetByAtomicSwapAddress(sourceChain, sourceAsset)!;
      const toAsset = getAssetByAtomicSwapAddress(destChain, destAsset)!;
      const receiveAmount = Object.values(quote.quotes)[0];
      const swapData: SwapParams = {
        fromAsset,
        toAsset,
        sendAmount: strategy.minAmount,
        receiveAmount,
        additionalData: {
          strategyId: strategy.id,
        },
      };
      const order = await garden.swap(swapData);
      if (order.error) {
        const errorMsg = `Error while creating order: ${order.error}`;
        console.log('❌', errorMsg);
        continue;
      }
      const matchedOrder = order.val;
      const initRes = await garden.evmHTLC?.initiate(matchedOrder);
      if (initRes?.error) {
        const errorMsg = `Error while initing order: ${initRes.error}`;
        console.log('❌', errorMsg);
        continue;
      }
      await garden.execute();
      console.log('✅ Trade execution completed successfully');
    }
  };
  it('switches to a different network when not already connected', async () => {
    try {
      const client = createWalletClient({
        account: evmAccount,
        chain: sepolia,
        transport: http(),
      });
      const res = await switchOrAddNetwork('citrea_testnet', client);
      expect(res.ok).toBeTruthy();
      expect(
        res.val.walletClient.chain?.name === 'Citrea Testnet',
      ).toBeTruthy();
    } catch (error) {
      console.error('Network switch test failed:', error);
      throw error;
    }
  }, 15000);
  it('skips switching when already connected to the target network', async () => {
    const client = createWalletClient({
      account: evmAccount,
      chain: sepolia,
      transport: http(),
    });
    const res = await switchOrAddNetwork('ethereum_sepolia', client);
    expect(res.ok).toBeTruthy();
    expect(res.val.message).toBe('Already on the network');
  }, 15000);
  it('should switch chain and do evm-evm trades in node environment', async () => {
    const client = createWalletClient({
      account: evmAccount,
      chain: sepolia,
      transport: http(),
    });
    const digestKey = DigestKey.generateRandom().val!;
    const garden = Garden.fromWallets({
      environment: Environment.TESTNET,
      digestKey: digestKey,
      wallets: {
        evm: client,
      },
    });
    await trade(garden);
  }, 150000);
});
