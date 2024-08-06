import { mainnet, arbitrum } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, arbitrum],
  connectors: [injected(), metaMask()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
});
