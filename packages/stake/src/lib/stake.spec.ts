import { describe, expect, test } from 'vitest';
import { StakeProvider } from './stake';
import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { sepolia } from 'viem/chains';
import { convertTo0xString } from './utils';
import { Url } from '@gardenfi/utils';

describe('stake', async () => {
  const provider = new ethers.JsonRpcProvider(
    'https://sepolia.infura.io/v3/c24c1e1e6de4409485f1a0ca83662575'
  );
  const api = new Url('https://staking.garden.finance');
  //provide a private key which has some SEED tokens
  const account = privateKeyToAccount(convertTo0xString(''));

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const sp = StakeProvider.init(walletClient);

  test.skip('getStakes', async () => {
    const res = await StakeProvider.getStakes(api, account.address);
    console.log('stakes', res.val);
    expect(res.ok).toBeTruthy();
  });

  test.skip('getGlobalStakingData', async () => {
    const res = await StakeProvider.getGlobalStakingData(api);
    console.log('res :', res.val);
    expect(res.ok).toBeTruthy();
  });

  test.skip('stake and vote', async () => {
    const res = await sp.stakeAndVote(2100, 6);
    console.log(res.val);
    expect(res.ok).toBeTruthy();
    expect(res.val).toBeTypeOf('string');
    expect(res.error).toBeUndefined();
  });

  test.skip('unstake', async () => {
    const res = await sp.unStake(
      '0x8636df0d65073632cc00550818d4e160a3f4fe724c90a1a4d038d3b431d973ab'
    );
    expect(res.ok).toBeTruthy();
    expect(res.val).toBeTypeOf('string');
    expect(res.error).toBeUndefined();
  });
  test.skip('extend', async () => {
    const res = await sp.extendStake(
      '0x8636df0d65073632cc00550818d4e160a3f4fe724c90a1a4d038d3b431d973ab',
      12
    );
    console.log('res.error :', res.error);
    expect(res.ok).toBeTruthy();
    expect(res.val).toBeTypeOf('string');
    expect(res.error).toBeUndefined();
  });
});
