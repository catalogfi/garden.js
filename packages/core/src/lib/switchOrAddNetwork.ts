import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  berachain,
  berachainTestnetbArtio,
  mainnet,
  sepolia,
  Chain as viemChain,
  monadTestnet,
  citreaTestnet,
} from 'viem/chains';
import {
  ArbitrumLocalnet,
  EthereumLocalnet,
  EvmChain,
} from '@gardenfi/orderbook';
import { createWalletClient, custom, WalletClient } from 'viem';
import { AsyncResult, Err, Ok } from '@catalogfi/utils';

interface EthereumWindow extends Window {
  ethereum?: any;
}
declare const window: EthereumWindow;

const updatedSepolia = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: ['https://ethereum-sepolia-rpc.publicnode.com'],
    },
  },
};

export const hyperliquidTestnet: viemChain = {
  id: 998,
  name: 'Hyperliquid EVM Testnet',
  nativeCurrency: {
    name: 'Hyperliquid',
    symbol: 'HYPE',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Explorer',
      url: 'https://testnet.purrsec.com/',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
  },
};

export const hyperliquid: viemChain = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    name: 'Hyperliquid',
    symbol: 'HYPE',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Explorer',
      url: 'https://hyperscan.gas.zip/',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
};

export const evmToViemChainMap: Record<EvmChain, viemChain> = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  ethereum_sepolia: updatedSepolia,
  arbitrum_sepolia: arbitrumSepolia,
  ethereum_localnet: EthereumLocalnet,
  arbitrum_localnet: ArbitrumLocalnet,
  base_sepolia: baseSepolia,
  base: base,
  bera_testnet: berachainTestnetbArtio,
  citrea_testnet: citreaTestnet,
  bera: berachain,
  monad_testnet: monadTestnet,
  hyperliquid_testnet: hyperliquidTestnet,
  hyperliquid: hyperliquid,
};

/**
 * Switches or adds a network to the wallet
 * @param chain Garden supported chain
 * @param walletClient
 * @returns new walletClient with updated chain
 */
export const switchOrAddNetwork = async (
  chain: EvmChain,
  walletClient: WalletClient,
): AsyncResult<{ message: string; walletClient: WalletClient }, string> => {
  const chainID = evmToViemChainMap[chain];
  if (chainID) {
    try {
      if (chainID.id === walletClient.chain?.id) {
        return Ok({ message: 'Already on the network', walletClient });
      }
      // switch the chain first
      await walletClient.switchChain({ id: chainID.id });
      const newWalletClient = createWalletClient({
        account: walletClient.account,
        chain: chainID,
        transport: custom(walletClient.transport),
      });

      return Ok({
        message: 'Switched chain',
        walletClient: newWalletClient as WalletClient,
      });
    } catch (error) {
      // If switching fails, attempt to add the network
      if (isChainNotFoundError(error)) {
        try {
          await walletClient.addChain({ chain: chainID });
          const newWalletClient = createWalletClient({
            account: walletClient.account,
            chain: chainID,
            transport: custom(window.ethereum!),
          });

          return Ok({
            message: 'Added network',
            walletClient: newWalletClient as WalletClient,
          });
        } catch {
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
