import { BitcoinNetwork } from './provider/provider.interface';

const path = (
  purpose: string,
  network: BitcoinNetwork,
  account: number,
  index?: number,
) =>
  `m/${purpose}'/${network === BitcoinNetwork.Mainnet ? 0 : 1}'/${account}'/0/${
    index ?? 0
  }`;

export const BitcoinPaths = {
  bip44: (network: BitcoinNetwork, index?: number, account?: number) =>
    path('44', network, account ?? 0, index),
  bip49: (network: BitcoinNetwork, index?: number, account?: number) =>
    path('49', network, account ?? 0, index),
  bip84: (network: BitcoinNetwork, index?: number, account?: number) =>
    path('84', network, account ?? 0, index),
};
