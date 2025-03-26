import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, sha256 } from 'viem';
import { randomBytes } from 'crypto';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { Auth, Environment, Siwe, sleep, Url, with0x } from '@gardenfi/utils';
import { Orderbook } from './orderbook';
import { CreateOrderReqWithStrategyId, MatchedOrder } from './orderbook.types';
import { Asset, Chains } from '../asset';
import { BitcoinNetwork, BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { Garden } from '@gardenfi/core';
import { API } from '@gardenfi/utils';

describe('orderbook', async () => {
  const OrderbookApi = 'orderbook.merry.dev';

  const pk = '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const account = privateKeyToAccount(with0x(pk));
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const btcWallet = BitcoinWallet.fromPrivateKey(
    'ca15db40a48aba44d613949a52b09721e901f02adf397d7e436e2a7f24024b58',
    new BitcoinProvider(BitcoinNetwork.Regtest, API.localnet.bitcoin),
  );

  const bitcoinTestnetAddress = await btcWallet.getAddress();
  console.log('bitcoinTestnetAddress', bitcoinTestnetAddress);
  const sepoliaAddress = walletClient.account.address;

  const auth = new Auth({ siwe: new Siwe(new Url('https://' + OrderbookApi + '/'), walletClient) });

  const orderbook = new Orderbook({
    url: 'http://' + OrderbookApi,
    walletClient,
    auth,
  });

  const garden = new Garden({
    environment: Environment.LOCALNET,
    evmWallet: walletClient,
    btcWallet
  });
  const createOrderIds: string[] = [];

  const bitcoinAsset: Asset = {
    name: 'Bitcoin Regtest',
    decimals: 8,
    symbol: 'BTC',
    chain: Chains.bitcoin_regtest,
    atomicSwapAddress: 'primary',
    tokenAddress: 'primary',
  };
  const WBTCArbitrumLocalnetAsset: Asset = {
    name: 'WBTC Arbitrum Localnet',
    decimals: 8,
    symbol: 'WBTC',
    chain: Chains.arbitrum_localnet,
    atomicSwapAddress: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    tokenAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  };
  const WBTCEthereumLocalnetAsset: Asset = {
    name: 'WBTC Ethereum Localnet',
    decimals: 8,
    symbol: 'WBTC',
    chain: Chains.ethereum_localnet,
    atomicSwapAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  };

  async function getAttestedQuote(
    orderWithStrategyId: CreateOrderReqWithStrategyId,
  ) {
    console.log('Getting attested quote...');
    const attestedQuoteResult = await garden.quote.getAttestedQuote(
      orderWithStrategyId,
    );
    if (attestedQuoteResult.ok) {
      console.log('✅ Attested Quote:', attestedQuoteResult.val);
      return attestedQuoteResult.val;
    } else {
      console.error(
        '❌ Error fetching attested quote:',
        attestedQuoteResult.error,
      );
      return null;
    }
  }

  const createOrderConfigs: any[] = [
    {
      source_chain: WBTCArbitrumLocalnetAsset.chain,
      destination_chain: WBTCEthereumLocalnetAsset.chain,
      source_asset: WBTCArbitrumLocalnetAsset.atomicSwapAddress,
      destination_asset: WBTCEthereumLocalnetAsset.atomicSwapAddress,
      initiator_source_address: sepoliaAddress,
      initiator_destination_address: sepoliaAddress,
      source_amount: "10000",
      destination_amount: "9990",
      fee: "1",
      nonce: "1741254355776",
      timelock: 246,
      secret_hash: sha256(randomBytes(32)).replace(/^0x/, ''),
      min_destination_confirmations: 3,
      additional_data: {
        strategy_id: "alel12",
      }
    },
    {
      source_chain: WBTCArbitrumLocalnetAsset.chain,
      destination_chain: bitcoinAsset.chain,
      source_asset: WBTCArbitrumLocalnetAsset.atomicSwapAddress,
      destination_asset: bitcoinAsset.atomicSwapAddress,
      initiator_source_address: bitcoinTestnetAddress,
      initiator_destination_address: sepoliaAddress,
      source_amount: "10000",
      destination_amount: "9990",
      fee: "1",
      nonce: "1741254378376",
      timelock: 246,
      secret_hash: sha256(randomBytes(32)).replace(/^0x/, ''),
      min_destination_confirmations: 2,
      additional_data: {
        strategy_id: "arbrry",
      }
    }
  ];

  test('creates 2 orders', async () => {
    for (const createOrder of createOrderConfigs) {
      const attestedQuote = await getAttestedQuote(createOrder);

      if (attestedQuote) {
        const response = await orderbook.createOrder(attestedQuote);
        console.log('response :', response.val);
        if (response.error) {
          console.log('response.error :', response.error);
        }
        createOrderIds.push(response.val);
        expect(response.ok).toBeTruthy();
      }
    }
  }, 20000);

  test('get the above created order after 5 sec of waiting', async () => {
    // wait for the created order to be matched
    await sleep(50000);
    const orderId = createOrderIds[0];
    const result = await orderbook.getOrder(orderId, true);
    expectTypeOf(result.val).toEqualTypeOf<MatchedOrder>();
    expect(result.ok).toBeTruthy();
    expect(result.val).toBeTruthy();
    expect(result.val.create_order.create_id).toEqual(orderId);
  }, 10000);
});
