import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { arbitrum, mainnet } from 'wagmi/chains';
import { injected, metaMask, safe } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GardenProvider } from '@gardenfi/react-hooks';
import { ArbitrumLocalnet, EthereumLocalnet } from '@gardenfi/orderbook';
import { BitcoinNetwork } from '@catalogfi/wallets';

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

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <GardenProvider
          config={{
            orderBookUrl: 'http://localhost:4426',
            store: localStorage,
            quoteUrl: 'http://localhost:4426',
            bitcoinNetwork: BitcoinNetwork.Regtest,
            bitcoinRPCUrl: 'http://localhost:30000',
          }}
        >
          <App />
        </GardenProvider>
      </QueryClientProvider>
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
