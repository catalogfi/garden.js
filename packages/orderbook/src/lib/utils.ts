import { WalletClient, Chain } from 'viem';
import { arbitrum, mainnet, sepolia } from 'viem/chains';
import { Err, Ok } from '@catalogfi/utils';
import { Url } from '@gardenfi/utils';
import { EvmChain, Chain as GardenChain } from './asset';
import { ArbitrumLocalnet, EthereumLocalnet } from './constants';

/**
 * Constructs a URL with the given base URL, endpoint and parameters (query params)
 * @param baseUrl Base URL
 * @param params Query params
 * @returns Constructed URL
 */
export const ConstructUrl = (
  baseUrl: Url,
  endPoint: string,
  params?: {
    [key: string]: string | number | boolean | undefined;
  },
): URL => {
  const url = baseUrl.endpoint(endPoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  return url;
};

export const ChainToID: Record<EvmChain, Chain> = {
  ethereum: mainnet,
  ethereum_arbitrum: arbitrum,
  ethereum_sepolia: sepolia,
  ethereum_localnet: EthereumLocalnet,
  arbitrum_localnet: ArbitrumLocalnet,
};

export const switchOrAddNetwork = async (
  chain: GardenChain,
  walletClient: WalletClient,
) => {
  const chainID = ChainToID[chain as EvmChain];
  if (chainID) {
    try {
      // switch the chain first
      await walletClient.switchChain({ id: chainID.id });
      return Ok('Switched chain');
    } catch (error) {
      // If switching fails, attempt to add the network
      if (isChainNotFoundError(error)) {
        try {
          await walletClient.addChain({ chain: chainID });
          return Ok('Added and switched chain');
        } catch (addError) {
          return Err('Failed to add network');
        }
      } else {
        return Err('Failed to switch network');
      }
    }
  } else {
    return Err('Chain not supported');
  }
};

const isChainNotFoundError = (error: unknown): error is { code: number } => {
  // Error code 4902 indicates the chain is not available in the wallet
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 4902
  );
};
