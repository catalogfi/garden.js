import {
  bitcoinRegtestAsset,
  Chains,
  WBTCArbitrumLocalnetAsset,
} from '@gardenfi/orderbook';
import { Quote } from './quote';
import { describe, expect, it } from 'vitest';

describe('quote', () => {
  const quoteUrl = 'https://testnet.api.hashira.io/quote';
  const quote = new Quote(quoteUrl);

  it('should get quote for evm-strk', async () => {
    const res = await quote.getQuote(
      'arbitrum:0x6b6303fab8ec7232b4f2a7b9fa58e5216f608fcb::bitcoin:primary',
      10000,
    );
    console.log('quote :', res.val);
    console.log('quote error :', res.error);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  });

  it('should get quote for strk-btc', async () => {
    const res = await quote.getQuote(
      'starknet_sepolia:0x13e7510b665d01c03f250e648c5be6f4a57b6cf56b3079293362ed2e4713c95::bitcoin_testnet:primary',
      10000000000000000,
    );
    console.log('quote :', res.val);
    console.log('quote error :', res.error);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  });

  it.only('should get quote for strk-evm', async () => {
    const res = await quote.getQuote(
      'starknet_sepolia:0x75cf614ce4ebce29ac622a50cd5151ddfff853159707589a85dd67b9fb1eba::arbitrum_sepolia:0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      10000000000000000,
    );
    console.log('quote :', res.val);
    console.log('quote error :', res.error);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  });

  it('exact_out', async () => {
    const res = await quote.getQuote(
      'arbitrum_localnet:0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9::bitcoin_regtest:primary',
      100000,
      true,
    );
    console.log('quote :', res.val);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
    expect(Number(Object.values(res.val.quotes)[0])).toBeGreaterThan(100000);
  });

  it('should get attested quote', async () => {
    const res = await quote.getAttestedQuote({
      source_chain: Chains.arbitrum_localnet,
      destination_chain: Chains.bitcoin_regtest,
      source_asset: WBTCArbitrumLocalnetAsset.atomicSwapAddress,
      destination_asset: bitcoinRegtestAsset.atomicSwapAddress,
      initiator_source_address: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      initiator_destination_address:
        'bcrt1qx2xlqqrf2jre8y63hu8v6ev5yht2rlpv493lfjbcrt1qx2xlqqrf2jre8y',
      source_amount: '100010',
      destination_amount: '100000',
      fee: '1',
      nonce: '1',
      min_destination_confirmations: 3,
      timelock: 14400,
      secret_hash:
        'c82602248bdcc41d4d353b39548bec8149107eaa3757a06e9f7f7d7d69c1af3a',
      additional_data: {
        strategy_id: 'arbrry',
        bitcoin_optional_recipient:
          'bcrt1qx2xlqqrf2jre8y63hu8v6ev5yht2rlpv493lfj',
      },
    });
    console.log('attested quote :', res.val);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  });

  it('test', async () => {
    const res = await quote.getAttestedQuote({
      source_chain: 'arbitrum_localnet',
      destination_chain: 'ethereum_localnet',
      source_asset: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      destination_asset: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      initiator_source_address: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      initiator_destination_address:
        '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      source_amount: '100000',
      destination_amount: '99990',
      fee: '1',
      nonce: '1',
      timelock: 14400,
      secret_hash:
        '0x7f769a74a0d00749b3995993aaa1312be285a4a2c8fa7f3d0a58f575be0cc62e',
      min_destination_confirmations: 3,
      additional_data: {
        strategy_id: 'alel12',
      },
    });
    console.log('attested quote :', res.val);
    if (res.error) console.log('error :', res.error);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  }, 30000);

  it('should get strategies', async () => {
    const res = await quote.getStrategies();
    console.log('strategies :', res.val);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  });
});
