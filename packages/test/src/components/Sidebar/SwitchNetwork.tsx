import { Button } from '../common/Button';
import { useEnvironmentStore } from '../../store/useEnvironmentStore';
import { useSwapStore } from "../../store/swapStore";
import { Environment } from '@gardenfi/utils';

export const SwitchNetwork = () => {
  const environment = useEnvironmentStore((state) => state.environment);
  const setEnvironment = useEnvironmentStore((state) => state.setEnvironment);
  const refreshAssets = useSwapStore((state) => state.refreshAssets);

  const handleSwitchNetwork = (newEnvironment: Environment) => {
    setEnvironment(newEnvironment);
    setTimeout(refreshAssets, 100);
  };

  return (
    <div className="flex w-full rounded-lg gap-2">
      <Button
        onClick={() => handleSwitchNetwork(Environment.MAINNET)}
        secondary={environment !== Environment.MAINNET}
      >
        Mainnet
      </Button>
      <Button
        onClick={() => handleSwitchNetwork(Environment.TESTNET)}
        secondary={environment !== Environment.TESTNET}
      >
        Testnet
      </Button>
      <Button
        onClick={() => handleSwitchNetwork(Environment.LOCALNET)}
        secondary={environment !== Environment.LOCALNET}
      >
        Localnet
      </Button>
    </div>
  );
};

export default SwitchNetwork;
