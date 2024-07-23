import { expect, test, describe } from 'vitest';
import { PaymentChannelService } from './service';
import { JsonRpcProvider, Wallet, sha256 } from 'ethers';
import { Url } from '../url';
import { Siwe } from '../auth/siwe';
// import { ERC20__factory } from '@catalogfi/wallets';

// this test is just a sanity check
// test out the service in whatever way you see fit and skip it

describe.skip('Payment channel service', () => {
  const pk = Wallet.createRandom().privateKey;
  //   const pk = '...';
  const provider = new JsonRpcProvider('...');
  const signer = new Wallet(pk, provider);
  const service = PaymentChannelService.init(
    'https://feehubdev.garden.finance',
    signer,
    new Siwe(new Url('https://stg-test-orderbook.onrender.com'), signer)
  );
  // const erc20 = ERC20__factory.connect(
  //   '0x5eedb3f5bbA7Da86b0bBa2c6450C52E27e105eeD',
  //   signer
  // );
  test.skip('create channel', async () => {
    const res = await service.createChannel('1000000');
    expect(res.ok).toBeTruthy();
    const paymentChannelAddress = res.val.address;
    expect(paymentChannelAddress).toBeDefined();

    console.log({
      signer: await signer.getAddress(),
    });
  });

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
});
