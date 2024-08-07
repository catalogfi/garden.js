import { JsonRpcProvider } from 'ethers';
import { getBlockNumber, getL1BlockNumber } from './utils';
import { describe, expect, test } from 'vitest';

describe('utils', () => {
  const ethProvider = new JsonRpcProvider(
    'https://mainnet.infura.io/v3/ac9d2c8a561a47739b23c52e6e7ec93f'
  );
  const arbProvider = new JsonRpcProvider(
    'https://rpc.ankr.com/arbitrum/14bf636bd9147bd8e59bbfcb992ad48cad9e1897d5052d170c956bde9b5071bc'
  );
  const sepoliaProvider = new JsonRpcProvider(
    'https://sepolia.infura.io/v3/c24c1e1e6de4409485f1a0ca83662575'
  );
  test('getBlockNumber', async () => {
    const ethBlockNumber = await getBlockNumber(ethProvider);
    const arbBlockNumber = await getBlockNumber(arbProvider);
    const sepoliaBlockNumber = await getBlockNumber(sepoliaProvider);
    console.log('ethBlockNumber :', ethBlockNumber.val);
    console.log('arbBlockNumber :', arbBlockNumber.val);
    console.log('sepoliaBlockNumber :', sepoliaBlockNumber.val);

    expect(ethBlockNumber.val).toBeTypeOf('number');
    expect(ethBlockNumber.error).toBeUndefined();
    expect(arbBlockNumber.val).toBeTypeOf('number');
    expect(arbBlockNumber.error).toBeUndefined();
    expect(sepoliaBlockNumber.val).toBeTypeOf('number');
    expect(sepoliaBlockNumber.error).toBeUndefined();
  });
  test('getL1BlockNumber', async () => {
    const l1BlockNumber = await getL1BlockNumber(arbProvider);
    const sepoliaL1BlockNumber = await getL1BlockNumber(sepoliaProvider);
    const sepBlockNumber = await getBlockNumber(sepoliaProvider);

    expect(l1BlockNumber.val).toBeTypeOf('number');
    expect(l1BlockNumber.error).toBeUndefined();
    expect(sepoliaL1BlockNumber.val).toBeLessThanOrEqual(sepBlockNumber.val);
    expect(sepoliaL1BlockNumber.error).toBeUndefined();
  });
});
