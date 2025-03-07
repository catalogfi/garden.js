import { describe, expect, it, vi } from 'vitest';
import { GardenHTLC } from './htlc';
import { generateInternalkey } from './internalKey';
import { IBitcoinWallet } from '@catalogfi/wallets';
import * as bitcoin from 'bitcoinjs-lib';

describe('GardenHTLC', () => {
  it('should log internal public key', () => {
    const internalPubkey = generateInternalkey();
    console.log('Internal PubKey:', internalPubkey.toString('hex'));
    expect(internalPubkey).toBeTruthy();
  });

  it('should create GardenHTLC instance correctly', async () => {
    const mockSigner: IBitcoinWallet = {
      getNetwork: vi.fn().mockResolvedValue(bitcoin.networks.testnet),
      getAddress: vi.fn().mockResolvedValue('tb1pn8ds655835vw9d88azjauzy7upxdlzyshtr9ffnp2pczme0wnenszydyws'),
      getProvider: vi.fn().mockResolvedValue({
        suggestFee: vi.fn().mockResolvedValue(1000),
        broadcast: vi.fn().mockResolvedValue('mockedTxId'),
        getTransaction: vi.fn().mockResolvedValue({ txid: 'mockedTxId' }),
        getUTXOs: vi.fn().mockResolvedValue([]),
      }),
      signSchnorr: vi.fn().mockResolvedValue(Buffer.from('mockedSignature', 'hex')),
      send: vi.fn().mockResolvedValue('mockedTxId'),
    } as unknown as IBitcoinWallet;

    const htlc = await GardenHTLC.from(
      mockSigner,
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
