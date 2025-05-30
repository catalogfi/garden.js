import { EvmRelay } from './evmRelay';
import { privateKeyToAccount } from 'viem/accounts';
import { describe, expect, it } from 'vitest';
import { createWalletClient, http } from 'viem';
import { DigestKey, Siwe, Url, API } from '@gardenfi/utils';
import { citreaTestnet } from 'viem/chains';
import { MatchedOrder } from '@gardenfi/orderbook';

describe('evmRelay', () => {
  const privKey = API.pk;
  const digestKey = new DigestKey(
    '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857',
  );

  const account = privateKeyToAccount(privKey as `0x${string}`);
  const citreaWalletClient = createWalletClient({
    account,
    chain: citreaTestnet,
    transport: http(),
  });

  const relayer = new EvmRelay(
    'https://testnet.api.garden.finance/relayer',
    citreaWalletClient,
    Siwe.fromDigestKey(
      new Url('https://testnet.api.garden.finance/auth'),
      digestKey,
    ),
  );

  it('should initiate on native HTLC', async () => {
    const order = {
      created_at: '2025-04-24T06:34:58.180469Z',
      updated_at: '2025-04-24T06:34:58.180469Z',
      deleted_at: null,
      source_swap: {
        created_at: '2025-04-24T06:34:58.175515Z',
        updated_at: '2025-04-24T06:34:58.176545Z',
        deleted_at: null,
        swap_id:
          '2c68739ec1c957c232f203c569c16073ebecb6180836f1536f30628c4b7c5132',
        chain: 'citrea_testnet',
        asset: '0x1e9551C889b098C24a0BE377909c3E7f53eB09BA',
        initiator: '0xd53D4f100AaBA314bF033f99f86a312BfbdDF113',
        redeemer: '0x29f72597ca8a21F9D925AE9527ec5639bAFD5075',
        timelock: 28800,
        filled_amount: '0',
        amount: '1000000000000000',
        secret_hash:
          '0f2f175ea677fa68a9a74d7a40ea31fcde04e409d48e7781d4dd3efafc025cde',
        secret: '',
        initiate_tx_hash: '',
        redeem_tx_hash: '',
        refund_tx_hash: '',
        initiate_block_number: '0',
        redeem_block_number: '0',
        refund_block_number: '0',
        required_confirmations: 1,
        current_confirmations: 0,
      },
      destination_swap: {
        created_at: '2025-04-24T06:34:58.175515Z',
        updated_at: '2025-04-24T06:34:58.177175Z',
        deleted_at: null,
        swap_id:
          '746252f93dad56a3a129ba87e9a6f72a9ecc3ff10971cbf6ba0e91744e5a5aad',
        chain: 'arbitrum_sepolia',
        asset: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
        initiator: '0x29f72597ca8a21F9D925AE9527ec5639bAFD5075',
        redeemer: '0xd53D4f100AaBA314bF033f99f86a312BfbdDF113',
        timelock: 600,
        filled_amount: '0',
        amount: '99700',
        secret_hash:
          '0f2f175ea677fa68a9a74d7a40ea31fcde04e409d48e7781d4dd3efafc025cde',
        secret: '',
        initiate_tx_hash: '',
        redeem_tx_hash: '',
        refund_tx_hash: '',
        initiate_block_number: '0',
        redeem_block_number: '0',
        refund_block_number: '0',
        required_confirmations: 0,
        current_confirmations: 0,
      },
      create_order: {
        created_at: '2025-04-24T06:34:58.180469Z',
        updated_at: '2025-04-24T06:34:58.180469Z',
        deleted_at: null,
        create_id:
          'c728fd851899fd54a08ea2d4e319c598c4c840db000ce85a4865f8a91118a660',
        block_number: '8184219',
        source_chain: 'citrea_testnet',
        destination_chain: 'arbitrum_sepolia',
        source_asset: '0x1e9551C889b098C24a0BE377909c3E7f53eB09BA',
        destination_asset: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
        initiator_source_address: '0xd53D4f100AaBA314bF033f99f86a312BfbdDF113',
        initiator_destination_address:
          '0xd53D4f100AaBA314bF033f99f86a312BfbdDF113',
        source_amount: '1000000000000000',
        destination_amount: '99700',
        fee: '0.27773358360736081357',
        nonce: '1745476494683',
        min_destination_confirmations: 0,
        timelock: 28800,
        secret_hash:
          '0f2f175ea677fa68a9a74d7a40ea31fcde04e409d48e7781d4dd3efafc025cde',
        user_id: '0x18Fd39c18fBCa3593aCeE33943cad1e2c4065F22',
        additional_data: {
          strategy_id: 'ct61asca',
          input_token_price: 92577.86120245204,
          output_token_price: 92577.86120245204,
          sig: 'a5258cca2855b6f0a52820699344f79dfc89cb4d830cad4e98c3b912a4a9903d074e39f462e366135dbc25b0d06f8ea651048e21308ed3c166a5f910f838f8531c',
          deadline: 1745480095,
          tx_hash:
            '0xf6369fa9fe95f67ca095eaa8465dc607ef9bce47c45a792d06a9300651e70cc3',
          is_blacklisted: false,
        },
      },
    } as MatchedOrder;

    const res = await relayer.initiate(order);
    console.log('res :', res.val);
    if (res.error) console.log('res.error :', res.error);
    expect(res.ok).toBeTruthy();
  });
});
