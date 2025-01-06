import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';

function App() {
  const { data: walletClient } = useWalletClient();

  return (
    <GardenProvider
      config={{
        store: localStorage,
        environment: Environment.TESTNET,
        walletClient: walletClient,
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
