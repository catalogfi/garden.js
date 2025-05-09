import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useAccount } from '@starknet-react/core';

function App() {
  const { data: walletClient } = useWalletClient();
  const { account: starknetAccount } = useAccount();

  return (
    <GardenProvider
      config={{
        environment: {
          environment: Environment.TESTNET,
          orderbook: 'https://testnet.api.hashira.io',
        },
        wallets: {
          evm: walletClient,
          starknet: starknetAccount,
        },
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
