import { Garden } from './garden';
import { Environment, with0x } from '@gardenfi/utils';
import { createWalletClient, http, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import {
  Chain,
  Chains,
  isBitcoin,
  MatchedOrder,
  // SupportedAssets,
} from '@gardenfi/orderbook';
import { sleep } from '@catalogfi/utils';
import { arbitrumSepolia, sepolia } from 'viem/chains';
import { Quote } from './../quote/quote';
// import { Orderbook } from 'gardenfi/orderbook';

describe('swap and execute using garden', () => {
  // const bitcoinAddress = 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru';
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const account = privateKeyToAccount(with0x(pk));
  console.log('account :', account.address);

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });
  const ethereumWalletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const quote = new Quote('https://quote-choas.onrender.com/');
  const orderBookUrl = 'https://evm-swapper-relay-1.onrender.com/';

  const garden = new Garden({
    environment: Environment.TESTNET,
    evmWallet: arbitrumWalletClient,
    orderbookURl: orderBookUrl,
    quote,
  });
  let wallets: Partial<{ [key in Chain]: WalletClient }> = {};

  wallets = {
    [Chains.arbitrum_sepolia]: arbitrumWalletClient,
    [Chains.ethereum_sepolia]: ethereumWalletClient,
    // [Chains.bitcoin_regtest]: btcWallet,
  };

  let order: MatchedOrder;

  it('should create an order', async () => {
    const orderObj = {
      fromAsset: {
        name: 'SEED',
        decimals: 18,
        symbol: 'SEED',
        chain: Chains.ethereum_sepolia,
        tokenAddress: '0x0dD677b602F9b90328d97ebB7Dc250587E019C68',
        atomicSwapAddress: '0x9A8c82C0D0a08242732DB21532d49cBf37812b1c',
      },
      toAsset: {
        name: 'BTC',
        decimals: 8,
        symbol: 'BTC',
        chain: Chains.bitcoin_testnet,
        tokenAddress: 'primary',
        atomicSwapAddress: 'primary',
      },
      sendAmount: '1000000000000000000000'.toString(),
      receiveAmount: '1060225'.toString(),
      additionalData: {
        strategyId: 'es1cbtry',
        btcAddress: 'tb1qxs3h0ac9mne3zle4jxucsrmef3ltx496769fgk',
      },
      minDestinationConfirmations: 3,
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
    const res = await garden.evmRelay.init(
      wallets[order.source_swap.chain] as WalletClient,
      order,
    );
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
      console.log('pendingrders :', orders.length);
    });
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
