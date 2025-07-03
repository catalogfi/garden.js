import { Button } from '../common/Button';
import { useStarknetWallet } from '../hooks/useStarknetWallet';

export const StarknetWallets = () => {
  const {
    starknetConnectors,
    starknetConnectAsync,
    starknetStatus,
    starknetSwitchChain,
  } = useStarknetWallet();

  const handleConnect = async (connector: any) => {
    try {
      await starknetConnectAsync({connector});
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start gap-2">
      <h2 className="text-sm opacity-60">Starknet Wallets</h2>
      <div className="grid grid-cols-2 gap-2 w-full items-center">
          {starknetConnectors.map((connector, i) => (
            <Button
              key={i}
              disabled={starknetStatus === 'connected'}
              onClick={() => handleConnect(connector)}
            >
              Connect {connector.name}
            </Button>
          ))}
          <Button
            disabled={starknetStatus !== 'connected'}
            secondary
            onClick={() => starknetSwitchChain()}
          >
            Switch Chain
          </Button>
      </div>
    </div>
  );
};

export default StarknetWallets;
