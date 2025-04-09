import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { arbitrum, mainnet } from 'wagmi/chains';
import { injected, metaMask, safe } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArbitrumLocalnet, EthereumLocalnet } from '@gardenfi/orderbook';
import { BTCWalletProvider } from '@gardenfi/wallet-connectors';
import { Network } from '@gardenfi/utils';
import { mainnet as snMainnet, sepolia } from '@starknet-react/chains';
import {
  argent,
  braavos,
  publicProvider,
  StarknetConfig,
} from '@starknet-react/core';

export const SupportedChains = [
  mainnet,
  arbitrum,
  ArbitrumLocalnet,
  EthereumLocalnet,
] as const;

export const config = createConfig({
  chains: SupportedChains,
  connectors: [injected(), metaMask(), safe()],
  multiInjectedProviderDiscovery: true,
  cacheTime: 10_000,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [ArbitrumLocalnet.id]: http(),
    [EthereumLocalnet.id]: http(),
  },
});

const queryClient = new QueryClient();

const connectors = [argent(), braavos()];
const chains = [snMainnet, sepolia];
const providers = publicProvider();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <StarknetConfig
        chains={chains}
        provider={providers}
        connectors={connectors}
      >
        <QueryClientProvider client={queryClient}>
          <BTCWalletProvider network={Network.MAINNET} store={localStorage}>
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
