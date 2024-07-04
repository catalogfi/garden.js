import { describe, it, expect } from 'vitest';
import { Assets, Chains, Orderbook } from '@gardenfi/orderbook';
import { JsonRpcProvider, Wallet } from 'ethers';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
  EVMWallet,
} from '@catalogfi/wallets';
import { GardenJS } from './garden';

describe('Garden JS', async () => {
  // these tests expect a local bitcoin node, ethereum node
  // and the orderbook backend to be running using merry

  const provider = new JsonRpcProvider('http://localhost:8545');
  const pk = Wallet.createRandom().privateKey;
  const signer = new Wallet(pk, provider);

  const bitcoinProvider = new BitcoinProvider(
    BitcoinNetwork.Regtest,
    'http://localhost:30000'
  );

  const bitcoinWallet = BitcoinWallet.createRandom(bitcoinProvider);

  const orderbook = await Orderbook.init({
    url: 'http://localhost:8080',
    signer,
  });

  const wallets = {
    [Chains.bitcoin_regtest]: bitcoinWallet,
    [Chains.ethereum_localnet]: new EVMWallet(signer),
  };

  const garden = new GardenJS(orderbook, wallets);

  it('should be able to create order', async () => {
    const orderId = await garden.swap(
      Assets.bitcoin_regtest.BTC,
      Assets.ethereum_localnet.WBTC,
      100000,
      90000
    );

    const order = await orderbook.getOrder(orderId);
    expect(order).toBeDefined();
    expect(order.maker).toEqual(
      (await signer.getAddress()).toLocaleLowerCase()
    );
    expect(order.orderPair).toContain(Chains.bitcoin_regtest);
    expect(order.orderPair).toContain(Chains.ethereum_localnet);

    const contracts = await orderbook.getSupportedContracts();
    expect(order.orderPair).toContain(contracts[Chains.ethereum_localnet]);
  });
});
