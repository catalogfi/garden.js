// import { WBTCArbitrumLocalnetAsset } from '@gardenfi/orderbook';

// import {
//   WBTCEthereumLocalnetAsset,
//   bitcoinRegtestAsset,
// } from '@gardenfi/orderbook';

import { SupportedAssets } from '@gardenfi/orderbook';

export enum IOType {
  input = 'input',
  output = 'output',
}

// export const chainToAsset = {
//   ethereum_localnet: WBTCEthereumLocalnetAsset,
//   arbitrum_localnet: WBTCArbitrumLocalnetAsset,
//   bitcoin_regtest: bitcoinRegtestAsset,
// };

export const chainToAsset = SupportedAssets.testnet;
