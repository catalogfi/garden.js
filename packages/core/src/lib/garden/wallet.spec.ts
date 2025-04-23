import { BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { Environment } from '@gardenfi/utils';
import { describe, it } from 'vitest';
import { getBitcoinNetwork } from '../utils';

describe('Bitcoin Wallet', () => {
  it('should create a bitcoin wallet from a private key', async () => {
    const wallet = BitcoinWallet.fromPrivateKey(
      '1ed70e76c15d55c33fed4a98e6f66833e9fdcd182f5ceb49095fcfbfdc52025e',
      new BitcoinProvider(getBitcoinNetwork(Environment.TESTNET)),
    );
    console.log(wallet);
    const pubKey = await wallet.getPublicKey();
    console.log(pubKey);
  });
});
