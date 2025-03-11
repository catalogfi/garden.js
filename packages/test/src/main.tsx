import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected, metaMask, safe } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BTCWalletProvider } from '@gardenfi/wallet-connectors';
import { Network } from '@gardenfi/utils';
import { InjectedConnector } from 'starknetkit/injected';
import {
  mainnet as starknet_mainnet,
  sepolia as starknet_sepolia,
} from '@starknet-react/chains';
import { StarknetConfig, publicProvider } from '@starknet-react/core';

import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  bsc,
  mainnet,
  optimism,
  polygon,
  sepolia,
  baseSepolia,
  base,
  berachainTestnetbArtio,
  berachain,
  citreaTestnet,
  monadTestnet,
} from 'wagmi/chains';

export const SupportedChains = [
  mainnet,
  arbitrum,
  polygon,
  optimism,
  bsc,
  avalanche,
  arbitrumSepolia,
  sepolia,
  baseSepolia,
  base,
  berachainTestnetbArtio,
  berachain,
  citreaTestnet,
  monadTestnet,
] as const;

export const config = createConfig({
  chains: SupportedChains,
  connectors: [injected(), metaMask(), safe()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [berachainTestnetbArtio.id]: http(),
    [berachain.id]: http(),
    [citreaTestnet.id]: http(),
    [monadTestnet.id]: http(),
  },
});

const chains = [starknet_mainnet, starknet_sepolia];
const connectors = [
  new InjectedConnector({ options: { id: 'braavos', name: 'Braavos' } }),
  new InjectedConnector({ options: { id: 'argentX', name: 'Argent X' } }),
];

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <StarknetConfig
        chains={chains}
        provider={publicProvider()}
        connectors={connectors}
      >
        <QueryClientProvider client={queryClient}>
          <BTCWalletProvider network={Network.TESTNET} store={localStorage}>
            <App />
          </BTCWalletProvider>
        </QueryClientProvider>
      </StarknetConfig>
    </WagmiProvider>
  </React.StrictMode>,
);

// pending orders number
// create order function
// trigger to know if the order is matched
// auto execute
// transactions
// assets
// quote
