import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';

function App() {
  const { data: walletClient } = useWalletClient();
  console.log('walletClient :', walletClient);
  return walletClient ? (
    <GardenProvider
      config={{
        store: localStorage,
        environment: Environment.TESTNET,
        walletClient: walletClient,
      }}
    >
      <Swap />
    </GardenProvider>
  ) : null;
}

export default App;
