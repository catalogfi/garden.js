import { GardenProvider } from '@gardenfi/react-hooks';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useEnvironmentStore } from './store/useEnvironmentStore';
import { useSwapStore } from './store/swapStore';

function App() {
  const { data: walletClient } = useWalletClient();
  const environment = useEnvironmentStore((state) => state.environment);
  const { btcWallet } = useSwapStore();

  return (
    <GardenProvider
      config={{
        store: localStorage,
        environment,
        walletClient: walletClient,
        btcWallet: btcWallet,
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
