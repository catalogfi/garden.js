import { useWalletStore } from '../../store/useWalletStore';
import { Button } from '../common/Button';

export const StarknetWallets = () => {
  const { isConnected, connect } = useWalletStore();
  return (
    <div className="flex flex-col items-start justify-start gap-2">
      <h2 className="text-sm opacity-60">Starknet Wallets</h2>
      <div className="grid grid-cols-2 gap-2 w-full">
        <Button disabled={isConnected} onClick={connect}>
          Connect Braavos
        </Button>
      </div>
    </div>
  );
};
