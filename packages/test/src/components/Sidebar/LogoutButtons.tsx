import { Button } from '../common/Button';
import { useAccount } from 'wagmi';
import { useDisconnect } from 'wagmi';
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';
import { useWalletStore } from '../../store/useWalletStore';
import {
  useAccount as StarknetAccount,
  useDisconnect as starknetDisconnect,
} from '@starknet-react/core';

export const LogoutButtons = () => {
  const { address: EvmAddress } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { disconnect: disconnectBTWWallet, account } = useBitcoinWallet();
  const { account: starknetAccount } = StarknetAccount();

  const EVMdisconnect = () => {
    disconnectWallet();
  };

  const BTCDisconnect = () => {
    disconnectBTWWallet();
  };

  const StarknetDisconnect = async () => {
    starknetDisconnect();
  };

  return (
    <div className="flex gap-2 w-1/2">
      <Button secondary disabled={!EvmAddress} onClick={EVMdisconnect}>
        EVM Logout
      </Button>
      <Button secondary disabled={!account} onClick={BTCDisconnect}>
        BTC Logout
      </Button>
      <Button
        secondary
        disabled={!starknetAccount}
        onClick={StarknetDisconnect}
      >
        Starknet Logout
      </Button>
    </div>
  );
};

export default LogoutButtons;
