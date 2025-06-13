'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GardenProviderWrapper from './GardenProviderWrapper';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import React from 'react';

// Create a query client for React Query
const queryClient = new QueryClient();

// Create Wagmi config directly
const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
  connectors: [
    injected(),
  ],
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}