import { SupportedAssets } from "@gardenfi/orderbook";

import { bitcoinRegtestAsset } from "@gardenfi/orderbook";

export enum IOType {
    input = "input",
    output = "output",
  }


export const chainToAsset = {
    ethereum_testnet: SupportedAssets.testnet.ethereum_sepolia_WBTC,
    arbitrum_testnet: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
    bitcoin_regtest: bitcoinRegtestAsset,
};