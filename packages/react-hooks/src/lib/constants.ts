import { BitcoinNetwork } from "@catalogfi/wallets";

export const GARDENCONFIG = {
  [BitcoinNetwork.Mainnet]: {
    orderBookUrl: "https://evm-swapper-relay.onrender.com",
    quoteUrl: "https://quote-knrp.onrender.com",
    bitcoinRPCUrl: "https://mempool.space",
    blockNumberFetcherUrl: "https://mempool.space"
  },
  [BitcoinNetwork.Testnet]: {
    orderBookUrl: "https://evm-swapper-relay.onrender.com",
    quoteUrl: "https://quote-knrp.onrender.com",
    bitcoinRPCUrl: "https://mempool.space/testnet4",
    blockNumberFetcherUrl: "https://mempool.space"
  },
} as const;

type ConfigType = {
  orderBookUrl: string;
  quoteUrl: string;
  bitcoinRPCUrl: string;
  blockNumberFetcherUrl: string;
};

export const getConfigForNetwork = (network: BitcoinNetwork): ConfigType => {
  return GARDENCONFIG[network];
};
