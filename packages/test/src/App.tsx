import { GardenProvider } from '@gardenfi/react-hooks';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useEnvironmentStore } from './store/useEnvironmentStore';
import { useSwapStore } from './store/swapStore';
import { BTCWalletProvider } from '@gardenfi/wallet-connectors';
import { Network } from '@gardenfi/utils';

function App() {
  const { data: walletClient } = useWalletClient();
  const environment = useEnvironmentStore((state) => state.environment);
  const btcWallet = useSwapStore((state) => state.btcWallet);

  return (
    <BTCWalletProvider
      network={environment === 'testnet' ? Network.TESTNET : Network.MAINNET}
      store={localStorage}
      key={environment}
    >
      <GardenProvider
        key={environment}
        config={{
          store: localStorage,
          environment,
          walletClient,
          btcWallet,
        }}
      >
        <Swap />
      </GardenProvider>
    </BTCWalletProvider>
  );
};

export default App;
