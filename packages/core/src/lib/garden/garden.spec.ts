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
  SupportedAssets,
} from '@gardenfi/orderbook';
import { sleep } from '@catalogfi/utils';
import { arbitrumSepolia, sepolia } from 'viem/chains';

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

  const garden = new Garden({
    environment: Environment.TESTNET,
    evmWallet: arbitrumWalletClient,
  });
  let wallets: Partial<{ [key in Chain]: WalletClient }> = {};

  wallets = {
    [Chains.arbitrum_sepolia]: arbitrumWalletClient,
    [Chains.ethereum_sepolia]: ethereumWalletClient,
    // [Chains.bitcoin_regtest]: btcWallet,
  };

  let order: MatchedOrder;

  it.skip('should create an order', async () => {
    const orderObj = {
      fromAsset:
        SupportedAssets.testnet
          .arbitrum_sepolia_0x1cd0bbd55fd66b4c5f7dfe434efd009c09e628d1,
      toAsset:
        SupportedAssets.testnet
          .ethereum_sepolia_0x3c6a17b8cd92976d1d91e491c93c98cd81998265,
      sendAmount: '1000000'.toString(),
      receiveAmount: '997000'.toString(),
      additionalData: {
        strategyId: 'aa1dea56',
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
  it.skip('Initiate the swap', async () => {
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
    await garden.execute();
    await sleep(150000);
  }, 150000);
});
