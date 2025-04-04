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
        environment: Environment.TESTNET,
        wallets: {
          evm: walletClient,
        },
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
