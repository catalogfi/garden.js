import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { IBitcoinProvider } from '@catalogfi/wallets';
import { createPublicClient, WalletClient, http, Chain } from 'viem';
import { mainnet } from 'viem/chains';

const L2_CHAINS = [42161, 421614];
/**
 * Fetches the latest block number of EVM chain
 * @param walletClient Wallet client
 * @returns EVM latest block number
 */
export const fetchEVMBlockNumber = async (
  walletClient: WalletClient,
): AsyncResult<number, string> => {
  if (!walletClient.chain) return Err('No chain found');

  // Fetch mainnet block number for L2 chains
  const chain = L2_CHAINS.includes(walletClient.chain.id)
    ? mainnet
    : walletClient.chain;
  return await _fetchEVMBlockNumber(chain);
};

export const _fetchEVMBlockNumber = async (chain: Chain) => {
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });
  try {
    const blockNumber = await publicClient.getBlockNumber();
    return Ok(Number(blockNumber));
  } catch (error) {
    return Err('Failed to fetch evm block number', error);
  }
};

/**
 * Fetches the latest block number of Bitcoin chain
 * @param btcProvider Bitcoin provider
 * @returns bitcoin latest block number
 */
export const fetchBitcoinBlockNumber = async (
  btcProvider: IBitcoinProvider,
): AsyncResult<number, string> => {
  try {
    const blockNumber = await btcProvider.getLatestTip();
    return Ok(blockNumber);
  } catch (error) {
    return Err('Failed to fetch bitcoin block number', error);
  }
};
