import { Asset, Chain, Chains, EvmChain } from './asset';
import { OrderpairErrors, OrderbookErrors } from './errors';

export const orderPairGenerator = (
  from: Asset,
  to: Asset,
  contracts: Partial<Record<Chain, string>>
) => {
  if (!contracts[from.chain] || !contracts[to.chain]) {
    let error = OrderbookErrors.UNSUPPORTED_CHAIN + ': ';
    error += 'only ' + Object.keys(contracts).join(', ') + ' are supported';
    throw new Error(error);
  }

  if (from.chain === to.chain) {
    throw new Error(OrderpairErrors.SAME_ASSET);
  }
  const fromBitcoin =
    from.chain === Chains.bitcoin ||
    from.chain === Chains.bitcoin_testnet ||
    from.chain === Chains.bitcoin_regtest;

  if (fromBitcoin) {
    return `${Chains[from.chain]}-${Chains[to.chain]}:${contracts[to.chain]}`;
  } else {
    return `${Chains[from.chain]}:${contracts[from.chain]}-${Chains[to.chain]}`;
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
