import { useWalletStore } from '../../store/useWalletStore';
import { Button } from '../common/Button';
import { Account, RpcProvider } from 'starknet';

const STARKNET_WALLETS = [
  {
    id: 'braavos',
    name: 'Braavos',
    icon: '/icons/braavos.png',
  },
  {
    id: 'argentX',
    name: 'Argent X',
    icon: '/icons/argent.png',
  },
];

const STARKNET_PRIVATE_KEY =
  '0x00000000000000000000000000000000c10662b7b247c7cecf7e8a30726cff12';
const STARKNET_ADDRESS =
  '0x0260a8311b4f1092db620b923e8d7d20e76dedcc615fb4b6fdf28315b81de201';
const STARKNET_NODE_URL = 'http://localhost:8547/rpc';

const snProvider = new RpcProvider({ nodeUrl: STARKNET_NODE_URL });
const starknetWallet = new Account(
  snProvider,
  STARKNET_ADDRESS,
  STARKNET_PRIVATE_KEY,
);

export const StarknetWallets = () => {
  const { isConnected, connect, signTypedData, wallet } = useWalletStore();
  console.log(starknetWallet);

  const handleClick = async () => {
    try {
      const sig = await signTypedData();
      console.log(sig);
    } catch (error) {
      console.log(error);
    }
  };

  console.log(wallet);
  // const snNew = new Account(snProvider, wallet.a, STARKNET_PRIVATE_KEY);

  return (
    <div className="flex flex-col items-start justify-start gap-2">
      <h2 className="text-sm opacity-60">Starknet Wallets</h2>
      <div className="grid grid-cols-2 gap-2 w-full">
        {STARKNET_WALLETS.map((wallet) => (
          <Button
            key={wallet.id}
            disabled={isConnected}
            onClick={() => connect(`${wallet.id}`)}
            className="flex items-center justify-center gap-2"
          >
            <span>Connect {wallet.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
