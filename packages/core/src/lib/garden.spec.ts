import { JsonRpcProvider, Wallet } from 'ethers';
import { Chains, Order, Orderbook } from '@gardenfi/orderbook';
import {
  BitcoinNetwork,
  BitcoinOTA,
  BitcoinProvider,
  BitcoinWallet,
  EVMWallet,
  generateMnemonic,
  mnemonicToPrivateKey,
} from '@catalogfi/wallets';
import { GardenJS } from './garden';
import { Assets } from '@gardenfi/orderbook';
import { GardenErrors } from './errors';
import { fund } from './testUtils';

import { describe, it, expect } from 'vitest';

const orderStatus = (order: Order) =>
  +`${order.status}${order.initiatorAtomicSwap.swapStatus}${order.followerAtomicSwap.swapStatus}`;

describe('Garden', () => {
  const OrderbookApi = '127.0.0.1:8080';

  const provider = new JsonRpcProvider('http://localhost:8545');
  const mnemonic = generateMnemonic();
  const pk = mnemonicToPrivateKey(mnemonic, BitcoinNetwork.Regtest);
  const bitcoinPk = mnemonicToPrivateKey(mnemonic, BitcoinNetwork.Regtest); //add pks that are funded for the last test to pass

  const ethereumSigner = new Wallet(pk, provider);

  const orderbook = new Orderbook({
    url: 'http://' + OrderbookApi,
    signer: ethereumSigner,
  });
  const bitcoinProvider = new BitcoinProvider(
    BitcoinNetwork.Regtest,
    'http://localhost:30000'
  );

  const sendAmount = 0.0001 * 1e8;
  const receiveAmount = sendAmount - 0.003 * sendAmount;

  it("cannot swap if there's no from wallet", async () => {
    const garden = new GardenJS(orderbook, {
      bitcoin_regtest: new BitcoinOTA(bitcoinProvider, ethereumSigner),
    });
    expect(
      async () =>
        await garden.swap(
          Assets.ethereum_localnet.WBTC, //no evm wallet (from)
          Assets.bitcoin_regtest.BTC,
          sendAmount,
          receiveAmount
        )
    ).rejects.toThrow(GardenErrors.WALLET_NOT_FOUND(true));
  });

  it('should calculate the receive amount correctly', async () => {
    const garden = new GardenJS(orderbook, {
      bitcoin_regtest: new BitcoinOTA(bitcoinProvider, ethereumSigner),
    });
    const receiveAmount = await garden.calculateReceiveAmt(
      Assets.bitcoin_regtest.BTC,
      Assets.ethereum_localnet.WBTC,
      100000
    );

    expect(receiveAmount).toEqual(99700);
  });

  it("cannot swap if there's no to wallet", async () => {
    const garden = new GardenJS(orderbook, {
      bitcoin_regtest: new BitcoinOTA(bitcoinProvider, ethereumSigner),
    });
    expect(
      async () =>
        await garden.swap(
          Assets.bitcoin_regtest.BTC,
          Assets.ethereum_localnet.WBTC, // no evm wallet(to)
          sendAmount,
          receiveAmount
        )
    ).rejects.toThrow(GardenErrors.WALLET_NOT_FOUND(false));
  });

  it("cannot swap if there's no bitcoin wallet", async () => {
    const garden = new GardenJS(orderbook, {
      ethereum_localnet: new EVMWallet(ethereumSigner),
      ethereum: new EVMWallet(ethereumSigner),
    });

    expect(async () => {
      await garden.swap(
        Assets.ethereum_localnet.WBTC,
        Assets.ethereum_localnet.WBTC,
        sendAmount,
        receiveAmount
      );
    }).rejects.toThrow(GardenErrors.CHAIN_WALLET_NOT_FOUND('EVM'));
  });

  it('should be able to create order with valid parameters', async () => {
    const bitcoinWallet = BitcoinWallet.fromPrivateKey(
      bitcoinPk,
      bitcoinProvider
    );

    const evmWallet = new EVMWallet(ethereumSigner);

    const garden = new GardenJS(orderbook, {
      ethereum_localnet: evmWallet,
      bitcoin_regtest: bitcoinWallet,
    });

    const orderId = await garden.swap(
      Assets.bitcoin_regtest.BTC,
      Assets.ethereum_localnet.WBTC,
      100000,
      90000
    );

    const order = await orderbook.getOrder(orderId);
    expect(order).toBeDefined();
    expect(order.maker).toEqual(
      (await ethereumSigner.getAddress()).toLocaleLowerCase()
    );
    expect(order.orderPair).toContain(Chains.bitcoin_regtest);
    expect(order.orderPair).toContain(Chains.ethereum_localnet);

    const contracts = await orderbook.getSupportedContracts();
    expect(order.orderPair).toContain(contracts[Chains.ethereum_localnet]);
  });

  it(
    'should initiate and redeem',
    async () => {
      const bitcoinWallet = BitcoinWallet.fromPrivateKey(
        bitcoinPk,
        bitcoinProvider
      );

      const evmWallet = new EVMWallet(ethereumSigner);

      await fund(await ethereumSigner.getAddress());
      await fund(await bitcoinWallet.getAddress());

      const garden = new GardenJS(orderbook, {
        ethereum_localnet: evmWallet,
        bitcoin_regtest: bitcoinWallet,
      });

      const orderId = await garden.swap(
        Assets.ethereum_localnet.WBTC,
        Assets.bitcoin_regtest.BTC,
        sendAmount,
        receiveAmount
      );

      const oldBtcBalance = await bitcoinWallet.getBalance();

      let txHash: string = '';

      expect(orderId).toBeTruthy();

      let statusChanged = false;
      let status = 0;

      garden.subscribeOrders(
        await ethereumSigner.getAddress(),
        async (orders) => {
          const currentOrder = orders.filter(
            (order) => order.ID === orderId
          )[0];
          if (!currentOrder) return;

          try {
            if (currentOrder) {
              const currentStatus = orderStatus(currentOrder);
              if (currentStatus === status) {
                return;
              }
              if (currentStatus === 200 || currentStatus === 222) {
                txHash = (await garden.getSwap(currentOrder).next()).output;
                statusChanged = true;
                status = currentStatus;
              }
            }
          } catch (err) {
            throw new Error((err as Error).message);
          }
        }
      );

      const expectedStatuses = [200, 222];

      for (let i = 0; i < expectedStatuses.length; i++) {
        while (!statusChanged)
          await new Promise((resolve) => setTimeout(resolve, 500));
        statusChanged = false;
        expect(status).toEqual(expectedStatuses[i]);
      }

      garden.unsubscribeOrders();

      const newBtcBalance = await bitcoinWallet.getBalance();

      expect(receiveAmount).toEqual(
        newBtcBalance -
          oldBtcBalance +
          (await getFeeFromTxId(bitcoinProvider, txHash))
      );
    },
    1000 * 1000
  );
});

const getFeeFromTxId = async (
  provider: BitcoinProvider,
  txid: string
): Promise<number> => {
  const tx = await provider.getTransaction(txid);

  return tx.fee;
};
