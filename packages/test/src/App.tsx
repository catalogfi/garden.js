import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';

function App() {
  const { data: walletClient } = useWalletClient();
  console.log('walletClient :', walletClient);

  return (
    <GardenProvider
      config={{
        store: localStorage,
        environment: Environment.LOCALNET,
        walletClient: walletClient,
        orderBookUrl: 'http://localhost:4426',
        quoteUrl: 'http://localhost:6969',
        bitcoinRPCUrl: 'http://localhost:30000',
        blockNumberFetcherUrl: 'http://localhost:3008',
        apiKey:
          'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c',
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
