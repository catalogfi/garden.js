import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { Balance } from './bitcoin.types';
import { Network } from '@gardenfi/utils';

const BitcoinExplorers = {
  testnet: {
    Mempool: 'https://mempool.space/testnet4',
  },
  mainnet: {
    Mempool: 'https://mempool.space',
    Blockstream: 'https://blockstream.info',
  },
  localnet: {
    Mempool: "http://localhost:30000"
  }
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
  network: Network,
): AsyncResult<Balance, string> => {
  const explorers = BitcoinExplorers[network];
  if (!explorers) return Err('Invalid network');

  const blockstreamUrl =
    'Blockstream' in explorers
      ? `${explorers.Blockstream}/api/address/${address}`
      : null;
  const mempoolUrl = `${explorers.Mempool}/api/address/${address}`;

  try {
    const urls = blockstreamUrl ? [blockstreamUrl, mempoolUrl] : [mempoolUrl];
    const response = await Fetcher.getWithFallback<BalanceResponse>(urls, {
      retryCount: 3,
      retryDelay: 1000,
    });

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
