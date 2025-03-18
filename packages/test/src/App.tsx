import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment, Passkey } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';

function App() {
  const { data: walletClient } = useWalletClient();
  console.log('walletClient :', walletClient);

  const passkeys = new Passkey('');

  return (
    <GardenProvider
      config={{
        auth: passkeys,
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
