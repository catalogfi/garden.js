import { createPublicClient, WalletClient, http, Chain } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { AsyncResult, Err, Ok } from '../result/result';

type L2ChainId = 42161 | 421614;
const L2_CHAINS: Record<L2ChainId, Chain> = {
  42161: mainnet,
  421614: sepolia,
} as const;

/**
 * Fetches the latest block number of EVM chain
 * @param walletClient Wallet client
 * @returns EVM latest block number
 */
export const fetchEVMBlockNumber = async (
  walletClient: WalletClient,
): AsyncResult<number, string> => {
  const { chain } = walletClient;

  if (!chain) return Err('No chain found');

  const isL2Chain = (chainId: number): chainId is L2ChainId =>
    chainId in L2_CHAINS;

  // Fetch mainnet block number for L2 chains
  const targetChain = isL2Chain(chain.id) ? L2_CHAINS[chain.id] : chain;
  return await _fetchEVMBlockNumber(targetChain);
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
