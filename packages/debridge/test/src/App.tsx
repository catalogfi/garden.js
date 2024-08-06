import * as React from 'react';
import { WagmiProvider } from 'wagmi';
import CreateTx from './CreateTx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccountDebridgeProvider from './AccountDebridgeProvider';
import { config } from './config';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AccountDebridgeProvider>
          <CreateTx />
        </AccountDebridgeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
