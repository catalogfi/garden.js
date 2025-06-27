import { describe, expect, it, beforeAll } from 'vitest';
import { GardenHTLC } from './htlc';
import { generateInternalkey } from './internalKey';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
import { API } from '@gardenfi/utils';

describe('GardenHTLC', () => {
  let btcWallet: BitcoinWallet;
  let htlc: GardenHTLC;
  const secretHash = '3a728f1df9c9971c7fb5c586d2b919f297b21852a46f14a161c33afc4bddb0f8';
  const secret = '3141592653589793238462643383279502884197169399375105820974944592'; // sha256(secret) = secretHash
  const initiatorPubkey = 'bc9a1ea94f786d05e42256eb76e24e426d8ad48ca671164ff96ac7e4c57678a7';
  const redeemerPubkey = 'bcd6f4cfa96358c74dbc03fec5ba25da66bbc92a31b714ce339dd93db1a9ffac';
  const expiry = 5;
  const amount = 99000;

  beforeAll(async () => {
    const rawPk = API.pk.startsWith('0x') ? API.pk.slice(2) : API.pk;
    btcWallet = BitcoinWallet.fromPrivateKey(
      rawPk,
      new BitcoinProvider(BitcoinNetwork.Regtest, API.localnet.bitcoin),
    );
    htlc = await GardenHTLC.from(
      btcWallet,
      amount,
      secretHash,
      initiatorPubkey,
      redeemerPubkey,
      expiry,
    );
  });

  it('should generate a valid internal public key', () => {
    const internalPubkey = generateInternalkey();
    console.log('Internal PubKey:', internalPubkey.toString('hex'));
    expect(internalPubkey).toBeTruthy();
    expect(internalPubkey.length).toBe(32);
  });

  it('should create a valid GardenHTLC instance', async () => {
    expect(htlc).toBeInstanceOf(GardenHTLC);
    expect(htlc.id()).toBeTruthy();
    console.log('HTLC Address:', htlc.id());
  });

  it('should generate a valid address', () => {
    const address = htlc.address();
    expect(address).toMatch(/^bcrt/); // Regtest prefix
  });

  it('should serialize leaf hash correctly', () => {
    const redeemHash = htlc.leafHash(0); // Redeem
    const refundHash = htlc.leafHash(1); // Refund
    const instantHash = htlc.leafHash(2); // Instant Refund

    expect(redeemHash.length).toBe(32);
    expect(refundHash.length).toBe(32);
    expect(instantHash.length).toBe(32);
  });

  it('should generate control block for redeem leaf', () => {
    const controlBlock = (htlc as any).generateControlBlockFor(0); // Leaf.REDEEM
    expect(Buffer.isBuffer(controlBlock)).toBe(true);
    expect(controlBlock.length).toBeGreaterThan(0);
  });
  
  // Advanced tests below can be skipped if no actual UTXOs are funded

  it.skip('should initialize the HTLC onchain', async () => {
    const txid = await htlc.init();
    console.log('Init TXID:', txid);
    expect(txid).toMatch(/^[a-fA-F0-9]{64}$/);
  });

  it.skip('should redeem HTLC with correct secret', async () => {
    const txid = await htlc.redeem(secret);
    console.log('Redeem TXID:', txid);
    expect(txid).toMatch(/^[a-fA-F0-9]{64}$/);
  });

  it.skip('should generate redeem hex transaction', async () => {
    const hex = await htlc.getRedeemHex(secret);
    console.log('Redeem TX Hex:', hex);
    expect(hex).toMatch(/^[a-fA-F0-9]+$/);
  });

  it.skip('should refund after expiry', async () => {
    const txid = await htlc.refund();
    console.log('Refund TXID:', txid);
    expect(txid).toMatch(/^[a-fA-F0-9]{64}$/);
  });
});
