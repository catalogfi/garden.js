import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { IBitcoinProvider } from '@catalogfi/wallets';
import { createPublicClient, WalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * Fetches the latest block number of EVM chain
 * @param walletClient Wallet client
 * @returns EVM latest block number
 */
export const fetchEVMBlockNumber = async (
  walletClient: WalletClient,
): AsyncResult<number, string> => {
  if (!walletClient.chain) return Err('No chain found');

  try {
    const publicClient = createPublicClient({
      chain: walletClient.chain,
      transport: http(),
    });

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

/**
 * Returns L1 blockNumber
 * @returns Ethereum chain latest block number
 */
export const fetchL1BlockNumber = async () => {
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });
  try {
    const blockNumber = await publicClient.getBlockNumber();
    return Ok(Number(blockNumber));
  } catch (error) {
    return Err('Failed to fetch evm block number', error);
  }
};
