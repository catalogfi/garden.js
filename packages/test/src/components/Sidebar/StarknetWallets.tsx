import { useWalletStore } from '../../store/useWalletStore';
import { Button } from '../common/Button';

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

export const StarknetWallets = () => {
  const { isConnected, connectWallet, wallet } = useWalletStore();

  //   const handleClick = async () => {
  //     try {
  //       const sig = await signTypedData();
  //       console.log(sig);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  console.log(wallet?.getChainId());

  return (
    <div className="flex flex-col items-start justify-start gap-2">
      <h2 className="text-sm opacity-60">Starknet Wallets</h2>
      <div className="grid grid-cols-2 gap-2 w-full">
        {STARKNET_WALLETS.map((wallet) => (
          <Button
            key={wallet.id}
            disabled={isConnected}
            onClick={() => connectWallet(`${wallet.id}`)}
            className="flex items-center justify-center gap-2"
          >
            <span>Connect {wallet.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
