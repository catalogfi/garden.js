import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useGarden, Garden } from '@gardenfi/swap';

function App() {
  const { data: walletClient } = useWalletClient();

  return (
    <GardenProvider
      config={{
        environment: {
          environment: Environment.TESTNET,
          orderbook: 'https://testnet.api.hashira.io',
        },
        wallets: {
          evm: walletClient,
        },
      }}
    >
      <Garden
        config={{
          environment: Environment.TESTNET,
          wallets: {},
        }}
      >
        <Swap />
      </Garden>
    </GardenProvider>
  );
}

export default App;
