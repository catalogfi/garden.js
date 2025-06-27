import { GardenProvider } from '@gardenfi/react-hooks';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useEnvironmentStore } from './store/useEnvironmentStore';
import { useSwapStore } from './store/swapStore';
import { useAccount } from "@starknet-react/core";
import { BTCWalletProvider } from '@gardenfi/wallet-connectors';
import { Network } from '@gardenfi/utils';

function App() {
  const { data: walletClient } = useWalletClient();
  const { account: starknetWallet } = useAccount();
  const btcWallet = useSwapStore((state) => state.btcWallet);
  const environment = useEnvironmentStore((state) => state.environment);

  return (
    <BTCWalletProvider
      network={environment === 'testnet' ? Network.TESTNET : environment === 'mainnet' ? Network.MAINNET : Network.LOCALNET}
      store={localStorage}
      key={environment}
    >
      <GardenProvider
        key={environment}
        config={{
          environment: {
            environment,
            orderbook: 'http://api.localhost',
            auth: 'http://api.localhost/auth',
            quote: 'http://api.localhost/quote',
            info: 'http://api.localhost/info',
            evmRelay: 'http://api.localhost/relayer',
            starknetRelay: 'http://api.localhost/starknet',
          },
          wallets: {
            evm: walletClient,
            starknet: starknetWallet
          },
          btcWallet,
        }}
      >
        <Swap />
      </GardenProvider>
    </BTCWalletProvider>
  );
};

export default App;
