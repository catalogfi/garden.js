import { describe, it, expect } from 'vitest';
import { BitcoinProvider, BitcoinWallet, BitcoinNetwork } from '@catalogfi/wallets';
import { Environment } from '@gardenfi/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { arbitrumSepolia } from 'viem/chains';
import { Garden } from './garden';

const PRIVATE_KEY = '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

describe('Arb WBTC to Eth WBTC Swap on Localnet', () => {
  const account = privateKeyToAccount(PRIVATE_KEY);

  const evmWalletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  const bitcoinProvider = new BitcoinProvider(
    BitcoinNetwork.Regtest,
    'https://indexer.merry.dev'
  );

  const btcWallet = BitcoinWallet.createRandom(bitcoinProvider);

  const garden = new Garden({
    environment: Environment.LOCALNET,
    evmWallet: evmWalletClient,
    btcWallet: btcWallet,
  });

  let order: MatchedOrder;
  let btcAddress: string;

  it('should create and fund BTC order', async () => {
    btcAddress = await btcWallet.getAddress();
    console.log('Generated BTC Address:', btcAddress);

    const orderParams = {
      fromAsset: SupportedAssets.localnet.arbitrum_localnet_WBTC,
      toAsset: SupportedAssets.localnet.ethereum_localnet_WBTC,
      sendAmount: '100000',
      receiveAmount: '99990',
      additionalData: {
        strategyId: 'alel12',
      },
      minDestinationConfirmations: 0,
    };

    // Create swap order
    const result = await garden.swap(orderParams);
    if (result.error) {
      console.error('Error creating order ❌:', result.error);
      throw new Error(result.error);
    }

    order = result.val;
    console.log('Order created ✅:', order.create_order.create_id);
    expect(result.error).toBeFalsy();
    expect(result.val).toBeTruthy();

    // Fund the BTC address
    await fund(btcAddress);
    console.log('BTC address funded ✅');
  }, 60000);

  it('should initiate and execute the swap', async () => {
    // Initiate the swap
    const res = await garden.evmRelay.init(evmWalletClient, order);
    console.log('Swap initiated ✅:', res.val);
    expect(res.ok).toBeTruthy();

    // Execute the swap
    console.log('Executing swap...');
    await garden.execute();
    console.log('Swap executed ✅');

    expect(order.destination_swap.redeem_tx_hash).toBeTruthy();
  }, 90000);
});

// Helper function for funding BTC address
async function fund(addr: string): Promise<void> {
  try {
    const response = await fetch('http://20.127.146.112:9090/fund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: addr }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    console.log('Funding request sent successfully! ✅');
  } catch (error) {
    console.error('Funding failed ❌:', error);
  }
}
