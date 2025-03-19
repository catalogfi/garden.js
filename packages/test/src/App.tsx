import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment, Passkey } from '@gardenfi/utils';
import { Swap } from './components/Swap';
import { useAuthStore } from './store/authStore';
import { useMemo } from 'react';

function App() {
  const { authToken } = useAuthStore();

  const passkeys = useMemo(() => new Passkey(authToken), [authToken]);

  return (
    <GardenProvider
      config={{
        store: localStorage,
        environment: Environment.TESTNET,
        auth: passkeys,
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
