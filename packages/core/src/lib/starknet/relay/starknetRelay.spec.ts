import { expect, it, describe } from 'vitest';
import { StarknetRelay } from './starknetRelay';
import { Account } from 'starknet';
import { STARKNET_CONFIG } from '../../constants';
import { RpcProvider } from 'starknet';
import { Network } from '@gardenfi/utils';

describe('StarknetRelay', () => {
  const STARKNET_PRIVATE_KEY =
    '0x03eb1a8fc77eac663580829c3cfc3c3f8d495f16366af1cf42a7f4460cfbcd97';
  const STARKNET_ADDRESS =
    '0x035c50625822eab248eb63f9198a0e4bdd02627526a4edc47d89ce678fe47b16';

  const snProvider = new RpcProvider({
    nodeUrl: STARKNET_CONFIG[Network.TESTNET].nodeUrl,
  });
  const starknetWallet = new Account(
    snProvider,
    STARKNET_ADDRESS,
    STARKNET_PRIVATE_KEY,
    '1',
    '0x3',
  );

  const relayerUrl = 'https://api.garden.finance/starknet';
  const relayer = new StarknetRelay(
    relayerUrl,
    starknetWallet,
    Network.TESTNET,
  );
});
