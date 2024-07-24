import { PaymentChannel } from './index';
import { expect, test, describe } from 'vitest';
import { JsonRpcProvider, Wallet, sha256 } from 'ethers';
import { ERC20__factory } from '@catalogfi/wallets';
import { Siwe, Url } from '@gardenfi/utils';

// this test is just a sanity check
// test out the service in whatever way you see fit and skip it

describe('Payment channel service', () => {
  // const pk = Wallet.createRandom().privateKey;
  const pk =
    '0xd3151a0e04c3a8fffa751399d8091794fe67babae347ed28bb5caf6efe4cfe8f';
  const provider = new JsonRpcProvider(
    'https://sepolia.infura.io/v3/c24c1e1e6de4409485f1a0ca83662575'
  );
  const signer = new Wallet(pk, provider);
  const service = PaymentChannel.init(
    'https://feehubdev.garden.finance',
    signer,
    new Siwe(new Url('https://stg-test-orderbook.onrender.com'), signer)
  );
  console.log('address', signer.address);

  test.skip('get channel state', async () => {
    const res = await service.getChannel();
    expect(res.ok).toBeTruthy();
    console.log(res.val);
    // const tx = await erc20.transfer(res.val.address, "1000000");
    // console.log(tx);
  });

  test.skip('get signature for conditional payment', async () => {
    const secretHash = sha256(Buffer.from('0'));
    const res = await service.createConditionalPayment({
      sendAmount: '0',
      receiveAmount: '1000',
      secretHash: secretHash,
    });
    expect(res.ok).toBeTruthy();
    expect(res.val).toBeDefined();
    expect(res.error).toBeUndefined();

    const res2 = await service.payConditionally({
      sendAmount: '0',
      receiveAmount: '1000',
      secretHash: secretHash,
    });
    expect(res2.ok).toBeTruthy();
    expect(res2.val).toBeDefined();
    expect(res2.error).toBeUndefined();
  }, 100000);

  test.skip('get secrets for withdrawal', async () => {
    const res = await service.computeSecretsForWithdrawal(12345);
    expect(res.ok).toBeTruthy();
    expect(res.val.secret).toBe(
      'ff60ebd5458a4669d58b269209f8b92763a911109517f4ecd89eb73e41bd28a3'
    );
    expect(res.val.secretHash).toBe(
      '0x08efe6ebd2bc90d9c2f68ca2c6614ca6fb5a75749edeeb83b0d527c62a1a0cc2'
    );
  });

  test.skip('initiate withdraw', async () => {
    const res = await service.initiateWithdraw();
    console.log('res.error :', res.error);

    expect(res.ok).toBeTruthy();
    expect(res.val).toBeUndefined();
    expect(res.error).toBeUndefined;
  });

  test.skip('signWithdraw message', async () => {
    const secrets = await service.computeSecretsForWithdrawal(12345);
    const channel = await service.getChannel();
    const res = await service.signWithdrawMessage(
      channel.val,
      BigInt(12345),
      secrets.val.secretHash,
      6360976
    );
    console.log('res.error :', res.error);
    console.log('res.val :', res.val);

    expect(res.ok).toBeTruthy();
    expect(res.val).toBeDefined();
    expect(res.error).toBeUndefined;
  });

  test.skip('initiate withdraw', async () => {
    const res = await service.initiateWithdraw();
    console.log('res.error :', res.error);

    expect(res.ok).toBeTruthy();
    expect(res.val).toBeInstanceOf(Object);
    expect(res.error).toBeUndefined;
  }, 10000);

  test.skip('amounts', async () => {
    const channel = await service.getChannel();
    const res = service.getAmountsFromChannel(channel.val);
    console.log('res :', res);
    expect(res).toBeTruthy();
  });

  test.skip('redeem rewards', async () => {
    const channel = await service.getChannel();
    if (channel.error) return console.log('channel.error :', channel.error);
    const res = await service.redeemRewards(channel.val);
    console.log('res.error :', res.error);
  });
});
