'use client';

import { wagmiAdapter, projectId } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import {
  mainnet,
  arbitrum,
  sepolia,
  solana,
  solanaTestnet,
  solanaDevnet,
  defineChain,
} from '@reown/appkit/networks';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import GardenProviderWrapper from './GardenProviderWrapper';
import { WagmiProvider, type Config } from 'wagmi';
import React from 'react';

const solanaLocalnet = defineChain({
  id: 123456789,
  caipNetworkId: 'solana:123456789',
  chainNamespace: 'solana',
  name: 'Solana Localnet',
  nativeCurrency: {
    decimals: 9,
    name: 'SOL',
    symbol: 'SOL',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8899'],
      webSocket: ['ws://localhost:8899'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'http://localhost:8899' },
  },
  contracts: {
    // Solana contracts would go here if needed
  },
});

const queryClient = new QueryClient();

const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
});

if (!projectId) {
  throw new Error('Project ID is not defined');
}

createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  projectId,
  networks: [solanaLocalnet],
  defaultNetwork: solanaLocalnet,
  features: {
    analytics: true,
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <GardenProviderWrapper>{children}</GardenProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
