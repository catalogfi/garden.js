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
        indexerUrl: 'http://20.127.146.112:30000',
        infoServer: 'http://20.127.146.112:9898',
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
