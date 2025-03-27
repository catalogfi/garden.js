import { describe, expect, it } from 'vitest';
import { checkAllowanceAndApprove } from './checkAllowanceAndApprove';
import { Account } from 'starknet';
import { RpcProvider } from 'starknet';

describe('Approve', () => {
  it('should approve', async () => {
    const STARKNET_PRIVATE_KEY =
      // '0x0440c893bd4cbc2c151d579c9d721eec4d316306f871368baa89033e3f6820b9';
      '0x075e69744ff5a9b4bd942b918293118dfcffc768033caacb9a8b8b269be7b312';
    const STARKNET_ADDRESS =
      // '0x0390cf09b3537e450170bdcce49a789facb727f21eabd8e1d25b8cf1869e8e93';
      '0x03ff66cbb9d97c9042dead5ef61d4b1d6d452f99e28f24b079e3d08ef4b4c4f3';

    const STARKNET_NODE_URL =
      'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/Ry6QmtzfnqANtpqP3kLqe08y80ZorPoY';

    const snProvider = new RpcProvider({ nodeUrl: STARKNET_NODE_URL });
    const starknetWallet = new Account(
      snProvider,
      STARKNET_ADDRESS,
      STARKNET_PRIVATE_KEY,
      '1',
      '0x3',
    );
    const approve = await checkAllowanceAndApprove(
      starknetWallet,
      '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      '0x13e7510b665d01c03f250e648c5be6f4a57b6cf56b3079293362ed2e4713c95',
      BigInt(10000000000000000),
      STARKNET_NODE_URL,
    );
    console.log('approve :', approve.val);
    expect(approve.val).toBeDefined();
  });
});
