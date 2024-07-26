import { Debridge } from './debridge';
import { describe, it, expect } from 'vitest';
import { DeBridgeErrors } from './debridge.types';
import { tokens } from './tokens';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

describe('DeBridge', () => {
  const debridge = new Debridge({
    debridgeDomain: 'https://api.dln.trade/v1.0',
    debridgeTxDomain: 'https://stats-api.dln.trade/api/Orders',
    debridgePointsDomain: 'https://points-api.debridge.finance/api/points',
  });

  it('should be able to get points', async () => {
    const points = await debridge.getPoints(
      '0x0000000000000000000000000000000000000000'
    );
    expect(points.ok).toBeTruthy();
    expect(points.val.totalPoints).toEqual(0);
  });

  it(
    'should be able to get a transaction',
    async () => {
      const tx = await debridge.getTx(
        '0x0fe70282cc628d9a4449cd371b6b209c4a0ae970dc3f188f9475d4dcc8863cf8'
      );
      expect(tx.ok).toBeTruthy();
      expect(tx.val.totalCount).toEqual(1);
    },
    10 * 1000
  );

  it('should be able to get multiple transactions', async () => {
    const txs = await debridge.getTxs({
      address: '0x0000000000000000000000000000000000000000',
    });

    expect(txs.ok).toBeTruthy();
    expect(txs.val.totalCount).toBeGreaterThan(0);
    expect(txs.val.totalCount).toEqual(txs.val.orders.length);
  });

  it(
    'should be able to get a quote when the fromAmount is specified',
    async () => {
      const quoteResponse = await debridge.quote({
        fromAddress: '0x9f2218D53A94ff958EF71166243ad10c4C462987',
        toAddress: '0x9f2218D53A94ff958EF71166243ad10c4C462987',
        fromToken: tokens.ethereum.WBTC,
        toToken: tokens.arbitrum.WBTC,
        amount: '1',
        isExactOut: false,
      });

      expect(quoteResponse.ok).toBeTruthy();
      expect(quoteResponse.val.quote).toBeTruthy();
      expect(quoteResponse.val.tx).toBeTruthy();
    },
    10 * 1000
  );

  it(
    'should be able to get a quote when the toAmount is specified',
    async () => {
      const quoteResponse = await debridge.quote({
        fromAddress: '0x9f2218D53A94ff958EF71166243ad10c4C462987',
        toAddress: '0x9f2218D53A94ff958EF71166243ad10c4C462987',
        fromToken: tokens.ethereum.WBTC,
        toToken: tokens.avalanche['btc.b'],
        amount: '1',
        isExactOut: true,
      });

      expect(quoteResponse.ok).toBeTruthy();
      expect(quoteResponse.val.quote).toBeTruthy();
      expect(quoteResponse.val.tx).toBeTruthy();
    },
    10 * 1000
  );

  it(
    'should abort when getting the abort signal',
    async () => {
      const abortController = new AbortController();
      setTimeout(() => abortController.abort(), 100);
      const createTxResponse = await debridge.quote(
        {
          fromAddress: '0x9f2218D53A94ff958EF71166243ad10c4C462987',
          toAddress: '0x9f2218D53A94ff958EF71166243ad10c4C462987',
          fromToken: tokens.ethereum.WBTC,
          toToken: tokens.arbitrum.WBTC,
          amount: '1',
          isExactOut: false,
        },
        abortController
      );

      expect(createTxResponse.ok).toBeFalsy();
      expect(createTxResponse.error).toBe(DeBridgeErrors.API_CALL_CANCELLED);
    },
    10 * 1000
  );

  it(
    'should be able to make a swap',
    async () => {
      const account = privateKeyToAccount(
        '0x3000000000000000000000000000000000000000000000000000000000000000'
      );

      const client = createWalletClient({
        account,
        chain: mainnet,
        transport: http(
          'https://rpc.tenderly.co/fork/48dc0393-e30d-4771-b53e-3e0183d4c881'
        ),
      });

      const address = account.address;

      const swapResponse = await debridge.swap({
        fromAddress: address,
        toAddress: address,
        fromToken: tokens.ethereum.WBTC,
        toToken: tokens.arbitrum.WBTC,
        amount: '1',
        isExactOut: false,
        client,
      });

      expect(swapResponse.ok).toBeTruthy();
      expect(swapResponse.val.txHash).toBeTruthy();
    },
    20 * 1000
  );
});
