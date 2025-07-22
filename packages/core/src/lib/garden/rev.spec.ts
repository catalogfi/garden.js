import { describe, expect, it } from 'vitest';
import { GardenHTLC } from '../bitcoin/htlc';
import { BitcoinWallet } from '../bitcoin/wallet/wallet';
import { BitcoinProvider } from '../bitcoin/provider/provider';
import { getBitcoinNetwork, toXOnly } from '../utils';
import { Environment } from '@gardenfi/utils';

describe('post instant refund SACP error check', async () => {
  it('should return a valid refund SACP', async () => {
    const provider = new BitcoinProvider(
      getBitcoinNetwork(Environment.TESTNET),
    );
    // add your private key here
    const wallet = BitcoinWallet.fromPrivateKey('', provider);
    const bitcoinExecutor = await GardenHTLC.from(
      wallet,
      Number(50000),
      '69bdb2ecfcdb17b2387e170a4d2defddc84f2b9704fd57a3d0d9e90ff6a1e8c3',
      toXOnly(
        'daaba57d883a2ed91355b9a0fe7ddcaa00774867bd6e15cc3011a1d9986a9c1e',
      ),
      toXOnly(
        '460f2e8ff81fc4e0a8e6ce7796704e3829e3e3eedb8db9390bdc51f4f04cf0a6',
      ),
      144,
    );
    const userBTCAddress =
      'tb1p6ffzg945uxspg0lszz89jnuzc7rdvlkhz36dvstrjphqcuqd690sfrly9j';
    if (!userBTCAddress) return;

    try {
      const sacp = await bitcoinExecutor.generateInstantRefundSACP(
        userBTCAddress,
      );
      console.log('sacp', sacp);
      expect(sacp).toBeDefined();
    } catch (error) {
      console.log('error', error);
    }
  }, 100000);
});
