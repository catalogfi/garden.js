import { GardenProvider } from '@gardenfi/react-hooks';
import { DigestKey, Environment, Siwe, Url } from '@gardenfi/utils';
import { useWalletClient } from 'wagmi';
import { Swap } from './components/Swap';
import { useAccount } from '@starknet-react/core';
import { EvmRelay, Quote, StarknetRelay } from '@gardenfi/core';
import { Orderbook } from '@gardenfi/orderbook';

function App() {
  const { data: walletClient } = useWalletClient();
  const { account: starknetAccount } = useAccount();
  console.log('walletClient :', walletClient);

  return (
    <GardenProvider
      config={{
        environment: Environment.TESTNET,
        // wallets: {
        //   evm: walletClient,
        //   starknet: starknetWallet,
        // },
        htlc: {
          starknet: new StarknetRelay(
            'https://starknet-relayer.hashira.io',
            starknetAccount!,
          ),
          evm: new EvmRelay(
            'https://orderbook-stage.hashira.io',
            walletClient!,
            Siwe.fromDigestKey(
              new Url('https://orderbook-stage.hashira.io'),
              DigestKey.generateRandom().val,
            ),
          ),
        },
        quote: new Quote('https://quote-staging.hashira.io/'),
        orderBook: new Orderbook(new Url('https://orderbook-stage.hashira.io')),
      }}
    >
      <Swap />
    </GardenProvider>
  );
}

export default App;
