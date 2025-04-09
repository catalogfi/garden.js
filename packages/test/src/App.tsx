import { GardenProvider } from '@gardenfi/react-hooks';
import { Environment } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useAccount } from '@starknet-react/core';

function App() {
  const { data: walletClient } = useWalletClient();
  const { account: starknetAccount } = useAccount();
  console.log('walletClient :', walletClient);

  return (
    <GardenProvider
      config={{
        environment: Environment.TESTNET,
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
