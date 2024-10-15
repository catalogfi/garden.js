import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { Balance, Network } from './bitcoin.types';

const BitcoinExplorers = {
  testnet: {
    Mempool: 'https://mempool.space/testnet',
    Blockstream: 'https://blockstream.info/testnet',
  },
  mainnet: {
    Mempool: 'https://mempool.space',
    Blockstream: 'https://blockstream.info',
  },
};

type BalanceResponse = {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
};

export const getBalance = async (
  address: string,
  network: Network
): AsyncResult<Balance, string> => {
  const explorers = BitcoinExplorers[network];
  if (!explorers) return Err('Invalid network');

  const blockstreamUrl = `${explorers.Blockstream}/api/address/${address}`;
  const mempoolUrl = `${explorers.Mempool}/api/address/${address}`;

  try {
    const response = await Fetcher.getWithFallback<BalanceResponse>(
      [blockstreamUrl, mempoolUrl],
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    );

    const confirmedBalanceSatoshis =
      response.chain_stats.funded_txo_sum - response.chain_stats.spent_txo_sum;
    const unconfirmedBalanceSatoshis =
      response.mempool_stats.funded_txo_sum -
      response.mempool_stats.spent_txo_sum;
    const totalBalanceSatoshis =
      confirmedBalanceSatoshis + unconfirmedBalanceSatoshis;

    return Ok({
      confirmed: confirmedBalanceSatoshis,
      unconfirmed: unconfirmedBalanceSatoshis,
      total: totalBalanceSatoshis,
    });
  } catch (error) {
    return Err('Error while fetching balance', error);
  }
};
