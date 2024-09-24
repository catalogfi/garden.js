import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, sha256 } from 'viem';
import { randomBytes } from 'crypto';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { withOx } from '@gardenfi/utils';
import { Orderbook } from './orderbook';
import { CreateOrderConfig, MatchedOrder } from './orderbook.types';
import { Asset, Chains } from '../asset';
import { sleep } from '../utils';

describe('orderbook', async () => {
  const OrderbookApi = 'localhost:4426';

  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const account = privateKeyToAccount(withOx(pk));
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  const bitcoinTestnetAddress = 'tb1qxtztdl8qn24axe7dnvp75xgcns6pl5ka9tzjru';
  const sepoliaAddress = walletClient.account.address;

  const orderbook = new Orderbook({
    url: 'http://' + OrderbookApi + '/',
    walletClient,
  });

  const createOrderIds: string[] = [];

  const bitcoinAsset: Asset = {
    name: 'Bitcoin Regtest',
    decimals: 8,
    symbol: 'BTC',
    chain: Chains.bitcoin_regtest,
    atomicSwapAddress: 'primary',
    tokenAddress: 'primary',
    isToken: true,
  };
  const WBTCArbitrumLocalnetAsset: Asset = {
    name: 'WBTC Arbitrum Localnet',
    decimals: 8,
    symbol: 'WBTC',
    chain: Chains.arbitrum_localnet,
    atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    isToken: true,
  };
  const WBTCEthereumLocalnetAsset: Asset = {
    name: 'WBTC Ethereum Localnet',
    decimals: 8,
    symbol: 'WBTC',
    chain: Chains.ethereum_localnet,
    atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    isToken: true,
  };

  const createOrderConfigs: CreateOrderConfig[] = [
    {
      fromAsset: WBTCEthereumLocalnetAsset,
      toAsset: WBTCArbitrumLocalnetAsset,
      sendAddress: sepoliaAddress,
      receiveAddress: sepoliaAddress,
      sendAmount: '100000',
      receiveAmount: '99000',
      secretHash: sha256(randomBytes(32)),
      nonce: '1',
      timelock: 246,
      minDestinationConfirmations: 3,
    },
    {
      fromAsset: WBTCArbitrumLocalnetAsset,
      toAsset: bitcoinAsset,
      sendAddress: bitcoinTestnetAddress,
      receiveAddress: sepoliaAddress,
      sendAmount: '100000',
      receiveAmount: '99000',
      secretHash: sha256(randomBytes(32)),
      nonce: '1',
      timelock: 246,
      minDestinationConfirmations: 3,
      btcInputAddress: bitcoinTestnetAddress,
    },
    // {
    //   fromAsset: WBTCEthereumLocalnetAsset,
    //   toAsset: bitcoinAsset,
    //   sendAddress: sepoliaAddress,
    //   receiveAddress: bitcoinTestnetAddress,
    //   sendAmount: '100000',
    //   receiveAmount: '99000',
    //   secretHash: sha256(randomBytes(32)),
    //   nonce: '1',
    //   timelock: 246,
    //   minDestinationConfirmations: 3,
    //   btcInputAddress: bitcoinTestnetAddress,
    // },
  ];

  test('creates 3 orders', async () => {
    for (const createOrder of createOrderConfigs) {
      const response = await orderbook.createOrder(createOrder);
      console.log('response :', response.val);
      if (response.error) {
        console.log('response.error :', response.error);
      }
      createOrderIds.push(response.val);
      expect(response.ok).toBeTruthy();
    }
  });

  test('get the above created order after 5 sec of waiting', async () => {
    // wait for the created order to be matched
    await sleep(5000);
    const orderId = createOrderIds[0];
    const result = await orderbook.getOrder(orderId, true);
    expectTypeOf(result.val).toEqualTypeOf<MatchedOrder>();
    expect(result.ok).toBeTruthy();
    expect(result.val).toBeTruthy();
    expect(result.val.create_order.create_id).toEqual(orderId);
  }, 10000);
});
