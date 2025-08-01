import { describe, expect, it } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { CreateOrderReqWithStrategyId, Orderbook } from '@gardenfi/orderbook';
import { SuiHTLC } from './suiHTLC';
import {
  ApiKey,
  DigestKey,
  Environment,
  Network,
  sleep,
  trim0x,
  Url,
} from '@gardenfi/utils';
import { Garden } from '../../garden/garden';
import { SecretManager } from '../../secretManager/secretManager';

describe.only('sui htlc init tests', () => {
  const url = 'https://testnet.api.hashira.io/orders';
  const create_order: CreateOrderReqWithStrategyId = {
    source_chain: 'sui_testnet',
    destination_chain: 'solana_testnet',
    source_asset:
      '0x1b02d7acf45a93db3fa8e84e6ff5d31f305a5f2e483d437803f910389c392744',
    destination_asset: '6eksgdCnSjUaGQWZ6iYvauv1qzvYPF33RTGTM1ZuyENx',
    source_amount: '10000000',
    destination_amount: '206237',
    nonce: '1753963050221',
    initiator_source_address:
      '276f0daa0b360b524191208df668356ff37af0012cf4ba8cb9a457924a37054c',
    initiator_destination_address:
      '6wpsRMVPfX8uJB9SRZF6n8HXZQ79gBrVzM5W8epTdWE5',
    additional_data: {
      strategy_id: 'st44stfo',
    },
    affiliate_fees: [],
  };
  let garden: Garden;
  it('should initiate', async () => {
    const privateKey =
      'suiprivkey1qrgdeyaw552slccg8gkqzacz64q3fyh3px890ltq3qkm0f90xm22j5ddka9';
    const account = Ed25519Keypair.fromSecretKey(privateKey);
    const htlc = new SuiHTLC(account, Network.TESTNET);
    garden = new Garden({
      auth: new ApiKey(
        'AAAAAGm47cw6Og5G37SuhX_uiXy8CYZCwx5XHgNS1DCsTi_HOzpOaAoYBPZLbGm1th0qVlom1EuaV_OtU6oJ_UIffIpsfVVDbKAc',
      ),
      orderbook: new Orderbook(new Url(url)),
      digestKey: DigestKey.generateRandom().val!,
      environment: Environment.TESTNET,
      htlc: {
        sui: new SuiHTLC(account, Network.TESTNET),
      },
    });
    const order = await garden.orderbook.createOrder(create_order, garden.auth);
    console.log('matched order', order);
    const initRes = await htlc.initiate(order.val!);
    console.log('initRes', initRes);
    expect(initRes.ok).toBe(true);
  });
}, 95000);

describe(
  'sui htlc redeem tests',
  () => {
    const url = 'https://testnet.api.hashira.io/orders';
    const create_order: CreateOrderReqWithStrategyId = {
      source_chain: 'solana_testnet',
      destination_chain: 'sui_testnet',
      source_asset: '6eksgdCnSjUaGQWZ6iYvauv1qzvYPF33RTGTM1ZuyENx',
      destination_asset:
        '0x1b02d7acf45a93db3fa8e84e6ff5d31f305a5f2e483d437803f910389c392744',
      source_amount: '1000',
      destination_amount: '100',
      nonce: '1753963050221',
      initiator_source_address: 'YH4btvqb4JBWSEJh22MuA231ekpJ5JqbBXQY1apJtKH',
      initiator_destination_address:
        '276f0daa0b360b524191208df668356ff37af0012cf4ba8cb9a457924a37054c',
      additional_data: {
        strategy_id: 'stfost44',
      },
      affiliate_fees: [],
    };
    let garden: Garden;
    it('should initiate and redeem', async () => {
      const privateKey =
        'suiprivkey1qrgdeyaw552slccg8gkqzacz64q3fyh3px890ltq3qkm0f90xm22j5ddka9';
      const account = Ed25519Keypair.fromSecretKey(privateKey);
      garden = new Garden({
        auth: new ApiKey(
          'AAAAAGm47cw6Og5G37SuhX_uiXy8CYZCwx5XHgNS1DCsTi_HOzpOaAoYBPZLbGm1th0qVlom1EuaV_OtU6oJ_UIffIpsfVVDbKAc',
        ),
        orderbook: new Orderbook(new Url(url)),
        digestKey: DigestKey.generateRandom().val!,
        environment: Environment.TESTNET,
        htlc: {
          sui: new SuiHTLC(account, Network.TESTNET),
        },
      });
      const secretManager = SecretManager.fromDigestKey(
        garden.digestKey.digestKey,
      );
      const { secret, secretHash } = (
        await secretManager.generateSecret('garden-sui1')
      ).val!;
      const create_order_with_secret_hash: CreateOrderReqWithStrategyId = {
        ...create_order,
        secret_hash: trim0x(secretHash),
      };
      console.log('secret', secret);
      console.log('secretHash', secretHash);

      const order = await garden.orderbook.createOrder(
        create_order_with_secret_hash,
        garden.auth,
      );
      console.log('matched order', order);

      await sleep(1000 * 60 * 2);

      const htlc = new SuiHTLC(account, Network.TESTNET);
      const redeemRes = await htlc.redeem(order.val!, trim0x(secret));
      console.log('redeemRes', redeemRes);
      expect(redeemRes.ok).toBe(true);
    });
  },
  1000 * 60 * 5,
);

describe.skip(
  'sui htlc refund tests',
  () => {
    const url = 'https://testnet.api.hashira.io/orders';
    const create_order: CreateOrderReqWithStrategyId = {
      source_chain: 'sui_testnet',
      destination_chain: 'solana_testnet',
      source_asset:
        '0x1b02d7acf45a93db3fa8e84e6ff5d31f305a5f2e483d437803f910389c392744',
      destination_asset: '6eksgdCnSjUaGQWZ6iYvauv1qzvYPF33RTGTM1ZuyENx',
      source_amount: '10000000',
      destination_amount: '206237',
      nonce: '1753963050221',
      initiator_source_address:
        '276f0daa0b360b524191208df668356ff37af0012cf4ba8cb9a457924a37054c',
      initiator_destination_address:
        '6wpsRMVPfX8uJB9SRZF6n8HXZQ79gBrVzM5W8epTdWE5',
      additional_data: {
        strategy_id: 'st44stfo',
      },
      affiliate_fees: [],
    };
    let garden: Garden;
    it('should initiate and refund', async () => {
      const privateKey =
        'suiprivkey1qrgdeyaw552slccg8gkqzacz64q3fyh3px890ltq3qkm0f90xm22j5ddka9';
      const account = Ed25519Keypair.fromSecretKey(privateKey);
      const htlc = new SuiHTLC(account, Network.TESTNET);
      garden = new Garden({
        auth: new ApiKey(
          'AAAAAGm47cw6Og5G37SuhX_uiXy8CYZCwx5XHgNS1DCsTi_HOzpOaAoYBPZLbGm1th0qVlom1EuaV_OtU6oJ_UIffIpsfVVDbKAc',
        ),
        orderbook: new Orderbook(new Url(url)),
        digestKey: DigestKey.generateRandom().val!,
        environment: Environment.TESTNET,
        htlc: {
          sui: new SuiHTLC(account, Network.TESTNET),
        },
      });
      const order = (
        await garden.orderbook.createOrder(create_order, garden.auth)
      ).val!;
      console.log('matched order', order);

      const initRes = await htlc.initiate(order);
      expect(initRes.ok).toBe(true);
      console.log('init successfull');

      await sleep(1000 * 30); // wait for timelock

      const refundRes = await htlc.refund(order);
      console.log('refundRes', refundRes);
      expect(refundRes.ok).toBe(true);
    });
  },
  1000 * 60 * 5,
);
