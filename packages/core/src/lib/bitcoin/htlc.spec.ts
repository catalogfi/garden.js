import { describe, expect, it } from 'vitest';
import { GardenHTLC } from './htlc';
import { generateInternalkey } from './internalKey';
import { BitcoinNetwork, BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { API } from '@gardenfi/utils';

describe('GardenHTLC', () => {
  it('should log internal public key', () => {
    const internalPubkey = generateInternalkey();
    console.log('Internal PubKey:', internalPubkey.toString('hex'));
    expect(internalPubkey).toBeTruthy();
  });

  it('should create GardenHTLC instance correctly', async () => {
    const btcWallet = BitcoinWallet.fromPrivateKey(
        'ca15db40a48aba44d613949a52b09721e901f02adf397d7e436e2a7f24024b58',
        new BitcoinProvider(BitcoinNetwork.Regtest, API.localnet.bitcoin),
      );

    const htlc = await GardenHTLC.from(
      btcWallet,
      99000,
      '3a728f1df9c9971c7fb5c586d2b919f297b21852a46f14a161c33afc4bddb0f8',
      'bcd6f4cfa96358c74dbc03fec5ba25da66bbc92a31b714ce339dd93db1a9ffac',
      'bc9a1ea94f786d05e42256eb76e24e426d8ad48ca671164ff96ac7e4c57678a7',
      5,
    );

    expect(htlc).toBeInstanceOf(GardenHTLC);
    expect(htlc.id()).toBeTruthy();
    console.log('HTLC ID (Address):', htlc.id());
  });
});
