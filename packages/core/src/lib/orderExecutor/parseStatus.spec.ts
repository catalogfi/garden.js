import { MatchedOrder } from '@gardenfi/orderbook';
import { describe, expect, it } from 'vitest';
import { ParseSwapStatus } from './orderStatusParser';
import { createPublicClient, http } from 'viem';
import { ArbitrumLocalnet } from '../testUtils';

describe('parseStatus', () => {
  const publicClient = createPublicClient({
    chain: ArbitrumLocalnet,
    transport: http(),
  });
  const order: MatchedOrder = {
    created_at: '2024-09-28T20:10:43.731470Z',
    updated_at: '2024-09-28T20:10:44.682130Z',
    deleted_at: null,
    source_swap: {
      created_at: '2024-09-28T20:10:44.679670Z',
      updated_at: '2024-09-28T20:11:53.730756Z',
      deleted_at: null,
      swap_id:
        '4b09f01dd2c88aa873e6ade367e01dbada2fa27c0e54fd132ca702dcc1e7d1e2',
      chain: 'arbitrum_localnet',
      asset: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      initiator: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      redeemer: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      timelock: 175,
      filled_amount: '100000',
      amount: '100000',
      secret_hash:
        'd50e8e51695f361eacf8f2ea7ff80f6292ef05e128d9f26028a75b5693d1c6bd',
      secret:
        '3f8a756793b843ce2f5a9055c056e8dece0deac1868ddfd0005f9cce0e677fb8',
      initiate_tx_hash:
        '0x5bad070571403206fc3785f738ce2c1214d219abb12be4311ec432d375daf0aa',
      redeem_tx_hash:
        '0xfedcaad966b6ad33cc075c5be193beddf2ddc33f297519f3f37241329f9d65bd',
      refund_tx_hash: '',
      initiate_block_number: '77',
      redeem_block_number: '83',
      refund_block_number: '0',
    },
    destination_swap: {
      created_at: '2024-09-28T20:10:44.680703Z',
      updated_at: '2024-09-28T20:11:33.726582Z',
      deleted_at: null,
      swap_id:
        'accb8060d0fda894064dd74f1025566163202c8be8f231ebaacb94285c24b262',
      chain: 'ethereum_localnet',
      asset: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      initiator: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      redeemer: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      timelock: 5,
      filled_amount: '99000',
      amount: '99000',
      secret_hash:
        'd50e8e51695f361eacf8f2ea7ff80f6292ef05e128d9f26028a75b5693d1c6bd',
      secret:
        '3f8a756793b843ce2f5a9055c056e8dece0deac1868ddfd0005f9cce0e677fb8',
      initiate_tx_hash:
        '0x0e76ae47bfb35369eb203e17555c76b7202a2c169edbe1a77e2dc87176f2d5f6',
      redeem_tx_hash:
        '0xd6f55e5dc27765ba16890a1e082e5de5227d1ba500b4e0adb3fbec59642ba148',
      refund_tx_hash: '',
      initiate_block_number: '75',
      redeem_block_number: '76',
      refund_block_number: '0',
    },
    create_order: {
      created_at: '2024-09-28T20:10:43.731470Z',
      updated_at: '2024-09-28T20:10:44.682130Z',
      deleted_at: null,
      create_id:
        '95ff3550d69c5ea46bad5ce2ac64cd2033ec1bc7dbd3f49de213f996376c0a3d',
      block_number: '76',
      source_chain: 'arbitrum_localnet',
      destination_chain: 'ethereum_localnet',
      source_asset: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      destination_asset: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      initiator_source_address: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      initiator_destination_address:
        '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      source_amount: '100000',
      destination_amount: '99000',
      fee: '1',
      nonce: '1',
      min_destination_confirmations: 3,
      timelock: 175,
      secret_hash:
        'd50e8e51695f361eacf8f2ea7ff80f6292ef05e128d9f26028a75b5693d1c6bd',
      additional_data: {
        bitcoin_optional_recipient: '',
      },
    },
  };

  it('should return the correct status', async () => {
    const currentBlockNumber = await publicClient.getBlockNumber();
    console.log('currentBlockNumber :', currentBlockNumber);
    const status = ParseSwapStatus(
      order.source_swap,
      Number(currentBlockNumber),
    );
    console.log('status :', status);
    expect(status).toBe('Redeemed');
    expect(order).toBeDefined();
  });
});
