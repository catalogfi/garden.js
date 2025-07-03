import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useEffect } from "react";
import { useSwitchChain } from "@starknet-react/core";
import { constants } from "starknet";
import { Environment } from "@gardenfi/utils";
import { useEnvironmentStore } from "../../store/useEnvironmentStore";

export const useStarknetWallet = () => {
  const {
    connect: starknetConnect,
    connectors,
    connector: activeConnector,
    connectAsync: starknetConnectAsync,
  } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { address, status, account, chainId } = useAccount();
    const environment = useEnvironmentStore((state) => state.environment);

  //for analytics tracking
  useEffect(() => {
    if (status === "connected" && address && activeConnector) {
      localStorage.setItem(
        "starknetWalletStore",
        JSON.stringify({
          address: address,
          connector: activeConnector.name,
        })
      );
    }
  }, [status, address, activeConnector]);

  const { switchChainAsync, error } = useSwitchChain({
    params: {
      chainId:
        environment === Environment.MAINNET
          ? constants.StarknetChainId.SN_SEPOLIA
          : constants.StarknetChainId.SN_MAIN,
    },
  });

  return {
    starknetConnect,
    starknetConnectAsync,
    starknetConnectors: connectors,
    starknetConnector: activeConnector,
    starknetDisconnect: disconnectAsync,
    starknetAddress: address,
    starknetStatus: status,
    starknetAccount: account,
    starknetChainId: chainId,
    starknetSwitchChain: switchChainAsync,
    starknetError: error,
  };
};
