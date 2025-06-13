import { WBTCArbitrumLocalnetAsset } from "@gardenfi/orderbook";

import { WBTCEthereumLocalnetAsset } from "@gardenfi/orderbook";

import { bitcoinRegtestAsset } from "@gardenfi/orderbook";

export enum IOType {
  input = "input",
  output = "output",
}


export const chainToAsset = {
  ethereum_localnet: WBTCEthereumLocalnetAsset,
  arbitrum_localnet: WBTCArbitrumLocalnetAsset,
  bitcoin_regtest: bitcoinRegtestAsset,
};
