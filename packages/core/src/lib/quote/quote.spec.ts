import {
  bitcoinRegtestAsset,
  Chains,
  WBTCArbitrumLocalnetAsset,
  WBTCEthereumLocalnetAsset,
} from '@gardenfi/orderbook';
import { Quote } from './quote';
import { describe, expect, it } from 'vitest';
import { API } from '@gardenfi/utils';

describe('quote', () => {
  const quoteUrl = API.localnet.quote;
  const quote = new Quote(quoteUrl);

  it('should get quote', async () => {
    const res = await quote.getQuote(
      'arbitrum_localnet:0x0165878A594ca255338adfa4d48449f69242Eb8F::ethereum_localnet:0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      100000,
    );
    console.log('quote :', res.val);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
  });

  it('exact_out', async () => {
    const res = await quote.getQuote(
      'arbitrum_localnet:0x0165878A594ca255338adfa4d48449f69242Eb8F::bitcoin_regtest:primary',
      100000,
      true,
    );
    console.log('quote :', res.val);
    expect(res.error).toBeUndefined();
    expect(res.val).toBeTruthy();
    expect(Number(Object.values(res.val.quotes)[0])).toBeGreaterThan(100000);
  });

  it('should get attested quote for Arbitrum WBTC to BTC', async () => {
    const res = await quote.getAttestedQuote({
      source_chain: Chains.arbitrum_localnet,
      destination_chain: Chains.bitcoin_regtest,
      source_asset: WBTCArbitrumLocalnetAsset.atomicSwapAddress,
      destination_asset: bitcoinRegtestAsset.atomicSwapAddress,
      initiator_source_address: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      initiator_destination_address: 'bcrt1qx2xlqqrf2jre8y63hu8v6ev5yht2rlpv493lfjbcrt1qx2xlqqrf2jre8y',
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

  it('should get attested quote for Arbitrum WBTC to ethereum WBTC', async () => {
    const res = await quote.getAttestedQuote({
      source_chain: Chains.arbitrum_localnet,
      destination_chain: Chains.ethereum_localnet,
      source_asset: WBTCArbitrumLocalnetAsset.atomicSwapAddress,
      destination_asset: WBTCEthereumLocalnetAsset.atomicSwapAddress,
      initiator_source_address: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      initiator_destination_address: '0x52FE8afbbB800a33edcbDB1ea87be2547EB30000',
      source_amount: '100000',
      destination_amount: '99990',
      fee: '1',
      nonce: '1',
      timelock: 14400,
      secret_hash: 'c82602248bdcc41d4d353b39548bec8149107eaa3757a06e9f7f7d7d69c1af3a',
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
