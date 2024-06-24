import { Asset, Chains, EvmChain } from "./asset";
import { CONTRACT_ADDRESS } from "./contractAddress";
import { OrderpairErrors } from "./errors";

export const orderPairGenerator = (from: Asset, to: Asset) => {
  if (from.chain === to.chain) {
    throw new Error(OrderpairErrors.SAME_ASSET);
  }
  const fromBitcoin =
    from.chain === Chains.bitcoin ||
    from.chain === Chains.bitcoin_testnet ||
    from.chain === Chains.bitcoin_regtest;

  if (fromBitcoin) {
    const toChainId = chainToId[to.chain as EvmChain];
    return `${Chains[from.chain]}-${Chains[to.chain]}:${
      CONTRACT_ADDRESS[toChainId].AtomicSwap
    }`;
  } else {
    const fromChainId = chainToId[from.chain as EvmChain];
    return `${Chains[from.chain]}:${CONTRACT_ADDRESS[fromChainId].AtomicSwap}-${
      Chains[to.chain]
    }`;
  }
};

export const chainToId: Record<EvmChain, number> = {
  ethereum: 1,
  ethereum_sepolia: 11155111,
  ethereum_arbitrum: 42161,
  ethereum_arbitrumlocalnet: 31338,
  ethereum_localnet: 31337,
};

export const idToChain: Record<number, EvmChain> = Object.entries(
  chainToId
).reduce((prev, [key, value]) => {
  prev[value] = key as EvmChain;
  return prev;
}, {} as Record<number, EvmChain>);
