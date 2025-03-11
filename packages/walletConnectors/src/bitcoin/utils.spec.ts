import { Network } from '@gardenfi/utils';
import { getBalance } from './utils';
import { describe, expect, test } from 'vitest';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
import * as bitcoin from 'bitcoinjs-lib';

describe('getBalance', () => {
  test.skip('should return balance', async () => {
    // test code
    const res = await getBalance(
      'bc1qxvay4an52gcghxq5lavact7r6qe9l4laedsazz8fj2ee2cy47tlqff4aj4',
      Network.MAINNET,
    );

    expect(res.ok).toBeTruthy();
    expect(res.val.confirmed).toBeTypeOf('number');
    expect(res.val.unconfirmed).toBeTypeOf('number');
    expect(res.val.total).toBeTypeOf('number');
  });

  test('generate unsigned psbt', async () => {
    const provider = new BitcoinProvider(BitcoinNetwork.Mainnet);
    const res = await BitcoinWallet.generateUnsignedPSBT(
      provider,
      bitcoin.networks.bitcoin,
      'bc1qgyq7vfqc8wg855qey5mar3d0zkz27p43zklp54',
      'bc1pqx4petqw4gfrzs7qfcyle95xsn7w39ukmtyy95zfytcldjztf0tqhe7rsj',
      1234,
    );
    console.log('res :', res);
  });
});
