import { JsonRpcProvider, Wallet } from 'ethers';
import { Debridge } from './debridge';
import { describe, it, expect } from 'vitest';
import { DeBridgeErrorCodes } from './debridge.types';

describe('DeBridge', () => {
  it('should be able to get points', async () => {
    const points = await Debridge.getPoints(
      '0x0000000000000000000000000000000000000000'
    );
    expect(points.ok).toBeTruthy();
    expect(points.val.totalPoints).toEqual(0);
  });

  it(
    'should be able to get a transaction',
    async () => {
      const tx = await Debridge.getTx(
        '0x0fe70282cc628d9a4449cd371b6b209c4a0ae970dc3f188f9475d4dcc8863cf8'
      );
      expect(tx.ok).toBeTruthy();
      expect(tx.val.totalCount).toEqual(1);
    },
    10 * 1000
  );

  it('should be able to get multiple transactions', async () => {
    const txs = await Debridge.getTxs({
      address: '0x0000000000000000000000000000000000000000',
    });

    expect(txs.ok).toBeTruthy();
    expect(txs.val.totalCount).toBeGreaterThan(0);
    expect(txs.val.totalCount).toEqual(txs.val.orders.length);
  });

  it(
    'should be able to create a tx',
    async () => {
      const abortController = new AbortController();
      const createTxResponse = await Debridge.createTx(
        {
          srcChainId: 1,
          srcChainTokenIn: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          isExactOut: false,
          dstChainId: 42161,
          dstChainTokenOut: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
          dstChainTokenOutRecipient:
            '0x3033A548f10f798c1aC7A77fB16f893B1Df07624',
          senderAddress: '0x3033A548f10f798c1aC7A77fB16f893B1Df07624',
          sellAmount: '1',
          srcTokenDecimals: 8,
        },
        abortController
      );

      expect(createTxResponse.ok).toBeTruthy();
      expect(createTxResponse.val.quote).toBeTruthy();
    },
    10 * 1000
  );

  it(
    'should abort when getting the abort signal',
    async () => {
      const abortController = new AbortController();
      setTimeout(() => abortController.abort(), 100);
      const createTxResponse = await Debridge.createTx(
        {
          srcChainId: 1,
          srcChainTokenIn: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          isExactOut: false,
          dstChainId: 42161,
          dstChainTokenOut: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
          dstChainTokenOutRecipient:
            '0x3033A548f10f798c1aC7A77fB16f893B1Df07624',
          senderAddress: '0x3033A548f10f798c1aC7A77fB16f893B1Df07624',
          sellAmount: '1',
          srcTokenDecimals: 8,
        },
        abortController
      );

      expect(createTxResponse.ok).toBeFalsy();
      expect(createTxResponse.error).toBe(
        DeBridgeErrorCodes.API_CALL_CANCELLED
      );
    },
    10 * 1000
  );

  it.skip(
    'should be able to make a swap',
    async () => {
      const provider = new JsonRpcProvider(
        'https://rpc.tenderly.co/fork/791394d4-d55d-4bf9-aa9a-4dca31365017'
      );
      const signer = new Wallet(
        '3000000000000000000000000000000000000000000000000000000000000000',
        provider
      );
      const abortController = new AbortController();

      const swapResponse = await Debridge.swap(
        {
          srcChainId: 1,
          srcChainTokenIn: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          isExactOut: false,
          dstChainId: 42161,
          dstChainTokenOut: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
          dstChainTokenOutRecipient:
            '0x3033A548f10f798c1aC7A77fB16f893B1Df07624',
          senderAddress: '0x3033A548f10f798c1aC7A77fB16f893B1Df07624',
          sellAmount: '1',
          srcTokenDecimals: 8,
          signer,
        },
        abortController
      );

      expect(swapResponse.ok).toBeTruthy();
      expect(swapResponse.val.txHash).toBeTruthy();
    },
    20 * 1000
  );
});
