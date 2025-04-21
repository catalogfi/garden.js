// import { WBTCArbitrumLocalnetAsset } from '@gardenfi/orderbook';

// import {
//   WBTCEthereumLocalnetAsset,
//   bitcoinRegtestAsset,
// } from '@gardenfi/orderbook';

import { SupportedAssets } from '@gardenfi/orderbook';
import { Asset, Chains } from '@gardenfi/orderbook';

export enum IOType {
  input = 'input',
  output = 'output',
}

export const stagingAssets = {
  testnet: {
    bitcoin_testnet_BTC: {
      name: 'Bitcoin',
      decimals: 8,
      symbol: 'BTC',
      chain: Chains.bitcoin_testnet,
      logo: 'https://garden-finance.imgix.net/token-images/bitcoin.svg',
      tokenAddress: 'primary',
      atomicSwapAddress: 'primary',
    },
    arbitrum_sepolia_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.arbitrum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
      atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
    },
    starknet_sepolia_ETH: {
      name: 'ETH Starknet Sepolia',
      decimals: 18,
      symbol: 'ETH',
      chain: Chains.starknet_sepolia,
      logo: 'https://garden-finance.imgix.net/chain_images/ethereum.svg',
      tokenAddress:
        '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      atomicSwapAddress:
        '0x75cf614ce4ebce29ac622a50cd5151ddfff853159707589a85dd67b9fb1eba',
    },
  },
};

export const chainToAsset = stagingAssets.testnet;
