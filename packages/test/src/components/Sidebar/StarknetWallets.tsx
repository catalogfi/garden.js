import { useEffect } from 'react';
import {
  argent,
  braavos,
  useAccount,
  useConnect,
  useDisconnect,
} from '@starknet-react/core';
import { Button } from '../common/Button';
import { useWalletStore } from '../../store/useWalletStore';

const STARKNET_WALLETS = [argent(), braavos()];

export const StarknetWallets = () => {
  const { connectors, connect } = useConnect();
  const { address, chainId, account } = useAccount();
  const { disconnect } = useDisconnect();
  const { isConnected, setWalletDetails, resetWallet } = useWalletStore();
  console.log('account', account);

  useEffect(() => {
    if (address) {
      setWalletDetails({
        wallet: connectors[0],
        account: account,
        chainId: chainId?.toString(),
      });
    }
  }, [address, chainId, connectors, setWalletDetails]);

  const handleConnect = async (walletId: string) => {
    try {
      const connector = connectors.find((c) => c.id === walletId);
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnect();
      resetWallet();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start gap-2">
      <h2 className="text-sm opacity-60">Starknet Wallets</h2>
      <div className="grid grid-cols-2 gap-2 w-full">
        {STARKNET_WALLETS.map((wallet) => (
          <Button
            key={wallet.id}
            disabled={!!account}
            onClick={() => handleConnect(wallet.id)}
            className="flex items-center justify-center gap-2"
          >
            <span>Connect {wallet.name}</span>
          </Button>
        ))}
      </div>
      {isConnected && address && (
        <div className="flex flex-col gap-2 w-full">
          <div className="text-sm break-all">Connected: {address}</div>
          <Button onClick={handleDisconnect} className="w-full" secondary>
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
};
