import { GardenProvider } from '@gardenfi/react-hooks';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useEnvironmentStore } from './store/useEnvironmentStore';

function App() {
  const { data: walletClient } = useWalletClient();
  const environment = useEnvironmentStore((state) => state.environment);

  return (
    <GardenProvider
      config={{
        store: localStorage,
        environment,
        walletClient: walletClient,
        indexerUrl: 'https://indexer-merry.hashira.io',
        infoServer: 'https://info-merry.hashira.io',
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
