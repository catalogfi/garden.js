import { Garden, SupportedAssetsResponse } from './garden';
import { Environment, with0x, DigestKey } from '@gardenfi/utils';
import { describe } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

describe('StarkNet Integration Tests', async () => {
  // Wallet configurations
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  // const DIGEST_KEY =
  //   '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';
  const DIGEST_KEY = DigestKey.generateRandom().val;

  // Global variables
  const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
  const evmWallet = createWalletClient({
    account: evmAccount,
    chain: arbitrumSepolia,
    transport: http(),
  });

  const garden = Garden.fromWallets({
    environment: Environment.MAINNET,
    digestKey: DIGEST_KEY!,
    wallets: {
      evm: evmWallet,
    },
  });

  const supportedAssets: SupportedAssetsResponse =
    await garden.supportedAssets();

  console.log('Supported Assets:', supportedAssets);
});
