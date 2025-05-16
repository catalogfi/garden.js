import { Account, RpcProvider } from 'starknet';
import { describe, it, expect, beforeAll } from 'vitest';
import { StarknetHTLC } from './starknetHTLC';
import { Garden } from '../../garden/garden';
import { Environment, sleep, trim0x, with0x } from '@gardenfi/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { WalletClient, createWalletClient, http } from 'viem';
import {
  CreateOrderReqWithStrategyId,
  EthereumLocalnet,
  getTimeLock,
  SupportedAssets,
} from '@gardenfi/orderbook';
import { BlockNumberFetcher, Quote } from '@gardenfi/core';
import { StarknetRelay } from '../relay/starknetRelay';
import { BitcoinProvider } from '../../bitcoin/provider';
import { BitcoinNetwork } from '../../bitcoin/provider/provider.interface';
import { BitcoinWallet } from '../../bitcoin/wallet';

describe('starknetHtlcTests', () => {
  const RELAYER_URL = 'http://localhost:4426';
  const STARKNET_NODE_URL = 'http://localhost:8547/rpc';
  const QUOTE_SERVER_URL = 'http://localhost:6969';
  const STARKNET_RELAY_URL = 'http://localhost:4436';
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  // const API_KEY =
  //   'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c';
  const accounts = [
    {
      address:
        '0x0260a8311b4f1092db620b923e8d7d20e76dedcc615fb4b6fdf28315b81de201',
      privateKey:
        '0x00000000000000000000000000000000c10662b7b247c7cecf7e8a30726cff12',
      publicKey:
        '0x02aa653a9328480570f628492a951c07621878fa429ac08bdbf2c9c388ae88b7',
    },
    {
      address:
        '0x014923a0e03ec4f7484f600eab5ecf3e4eacba20ffd92d517b213193ea991502',
      privateKey:
        '0x00000000000000000000000000000000e5852452e0757e16b127975024ade3eb',
      publicKey:
        '0x055c96342ff1304a2807755209735a35a7220ec18153cb516e376d47e6471083',
    },
  ];

  let alice: Account;
  //   let bob: Account;
  let provider: RpcProvider;
  let garden: Garden;
  let evmWallet: WalletClient;
  let btcWallet: BitcoinWallet;
  let htlc: StarknetHTLC;
  // run before all tests
  beforeAll(() => {
    provider = new RpcProvider({ nodeUrl: STARKNET_NODE_URL });
    alice = new Account(
      provider,
      accounts[0].address,
      accounts[0].privateKey,
      '1',
      '0x3',
    );
    // bob = new Account(provider, accounts[1].address, accounts[1].privateKey);
    const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
    console.log('Ethereum account address:', evmAccount.address);
    evmWallet = createWalletClient({
      account: evmAccount,
      chain: EthereumLocalnet,
      transport: http(),
    });
    const bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Regtest,
      'https://localhost:30000',
    );

    btcWallet = BitcoinWallet.fromPrivateKey(
      '3cd7c7cd08c2eb6aeac37e5654a05ebc2e92afe0adf109ea0c615c7cb8d9831f',
      bitcoinProvider,
    );
    console.log('Bitcoin wallet address:', btcWallet.getAddress());

    // garden = new Garden({
    //   environment: Environment.LOCALNET,
    //   evmWallet,
    //   starknetWallet: alice,
    //   orderbookURl: RELAYER_URL,
    //   quote: QUOTE_SERVER_URL,
    //   apiKey: API_KEY,
    //   starknetRelayUrl: STARKNET_RELAY_URL,
    //   btcWallet,
    // });

    garden = new Garden({
      api: RELAYER_URL,
      environment: Environment.LOCALNET,
      digestKey:
        '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
      quote: new Quote(QUOTE_SERVER_URL),
      blockNumberFetcher: new BlockNumberFetcher(
        'http://localhost:3008',
        Environment.LOCALNET,
      ),
      htlc: {
        starknet: new StarknetRelay(STARKNET_RELAY_URL, alice),
      },
    });
  });

  it('testing htlc initiate function', async () => {
    htlc = new StarknetHTLC(alice, STARKNET_NODE_URL);

    const nonce = Date.now().toString();
    const secrets = await garden.secretManager.generateSecret(nonce);
    const order: CreateOrderReqWithStrategyId = {
      source_chain: SupportedAssets.localnet.starknet_localnet_ETH.chain,
      destination_chain: SupportedAssets.localnet.ethereum_localnet_WBTC.chain,
      source_asset:
        SupportedAssets.localnet.starknet_localnet_ETH.atomicSwapAddress,
      destination_asset:
        SupportedAssets.localnet.ethereum_localnet_WBTC.atomicSwapAddress,
      initiator_source_address: alice.address,
      initiator_destination_address: evmWallet.account?.address ?? '',
      source_amount: '100000000000000000',
      destination_amount: '1000',
      fee: '1',
      nonce: nonce,
      timelock: getTimeLock(
        SupportedAssets.localnet.starknet_localnet_ETH.chain,
      ),
      secret_hash: trim0x(secrets.val.secretHash),
      min_destination_confirmations: 3,
      additional_data: {
        strategy_id: 'sdel10',
      },
    };

    const quoteRes = await garden.quote.getAttestedQuote(order);

    const createdOrder = await garden.orderbook.createOrder(
      quoteRes.val,
      garden.auth,
    );
    const orderId = createdOrder.val;
    console.log('created order:', orderId);

    let matchedOrder;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      console.log(`Attempt ${attempts + 1} to get matched order...`);
      await sleep(5000);
      matchedOrder = await garden.orderbook.getOrder(orderId, true);

      if (matchedOrder.val) {
        console.log('Order matched successfully!');
        break;
      }

      attempts++;
      if (attempts === maxAttempts) {
        console.error('Max attempts reached waiting for order to be matched');
      }
    }

    if (!matchedOrder?.val) {
      console.error('Failed to get matched order:', matchedOrder?.error);
      throw new Error('Matched order is null');
    }

    const initiateResult = await htlc.initiate(matchedOrder.val);
    if (initiateResult.error) {
      console.error('HTLC initiation failed:', initiateResult.error);
      throw new Error(initiateResult.error);
    }
    console.log('HTLC initiated with tx:', initiateResult.val);
    console.log('htlc initiated');

    // // Wait for the transaction to be confirmed
    await sleep(45000);

    // Redeem the HTLC
    console.log('Attempting to redeem HTLC...');
    if (!garden.evmHTLC) {
      console.warn('EVMHTLC is not initialized, skipping redemption');
      return;
    }
    const redeemResult = await garden.evmHTLC.redeem(
      matchedOrder.val,
      secrets.val.secret,
    );
    if (redeemResult.error) {
      console.error('HTLC redemption failed:', redeemResult.error);
      throw new Error(redeemResult.error);
    }
    console.log('HTLC redeemed with tx:', redeemResult.val);

    expect(true).toBe(true);
  }, 150000);

  //   it('testing htlc redeem function', async () => {
  //     htlc = new StarknetHTLC(alice, STARKNET_NODE_URL);
  //     const nonce = Date.now().toString();
  //     const secrets = await garden.secretManager.generateSecret(nonce);
  //     const order: CreateOrderReqWithStrategyId = {
  //       source_chain: SupportedAssets.localnet.ethereum_localnet_WBTC.chain,
  //       destination_chain: SupportedAssets.localnet.starknet_localnet_ETH.chain,
  //       source_asset:
  //         SupportedAssets.localnet.ethereum_localnet_WBTC.atomicSwapAddress,
  //       destination_asset:
  //         SupportedAssets.localnet.starknet_localnet_ETH.atomicSwapAddress,
  //       initiator_source_address: evmWallet.account?.address ?? '',
  //       initiator_destination_address: alice.address,
  //       source_amount: '1000',
  //       destination_amount: '1000',
  //       fee: '1',
  //       nonce: nonce,
  //       timelock: getTimeLock(
  //         SupportedAssets.localnet.ethereum_localnet_WBTC.chain,
  //       ),
  //       secret_hash: trim0x(secrets.val.secretHash),
  //       min_destination_confirmations: 3,
  //       additional_data: {
  //         strategy_id: 'elsd12',
  //       },
  //     };
  //     console.log(order.fee);

  //     const quoteRes = await garden.quote.getAttestedQuote(order);

  //     const createdOrder = await garden.orderbook.createOrder(quoteRes.val);
  //     const orderId = createdOrder.val;
  //     console.log('created order:', orderId);

  //     let matchedOrder;
  //     let attempts = 0;
  //     const maxAttempts = 10;

  //     while (attempts < maxAttempts) {
  //       console.log(`Attempt ${attempts + 1} to get matched order...`);
  //       await sleep(5000);
  //       matchedOrder = await garden.orderbook.getOrder(orderId, true);

  //       if (matchedOrder.val) {
  //         console.log('Order matched successfully!');
  //         break;
  //       }

  //       attempts++;
  //       if (attempts === maxAttempts) {
  //         console.error('Max attempts reached waiting for order to be matched');
  //       }
  //     }

  //     if (!matchedOrder?.val) {
  //       console.error('Failed to get matched order:', matchedOrder?.error);
  //       throw new Error('Matched order is null');
  //     }

  //     const initiateResult = await garden.evmRelay.init(
  //       evmWallet,
  //       matchedOrder.val,
  //     );
  //     if (initiateResult.error) {
  //       console.error('HTLC initiation failed:', initiateResult.error);
  //       throw new Error(initiateResult.error);
  //     }
  //     console.log('HTLC initiated with tx:', initiateResult.val);
  //     console.log('htlc initiated');
  //     await sleep(45000);
  //     // Redeem the HTLC
  //     console.log('Attempting to redeem HTLC...');
  //     const redeemResult = await htlc.redeem(
  //       matchedOrder.val,
  //       secrets.val.secret,
  //     );
  //     if (redeemResult.error) {
  //       console.error('HTLC redemption failed:', redeemResult.error);
  //       throw new Error(redeemResult.error);
  //     }
  //     console.log('HTLC redeemed with tx:', redeemResult.val);
  //     expect(true).toBe(true);
  //   }, 150000);
});
