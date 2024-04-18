import { Chains as n } from "./index4.js";
import { CONTRACT_ADDRESS as a } from "./index5.js";
import { OrderpairErrors as o } from "./index9.js";
const u = (i, r) => {
  if (i.chain === r.chain)
    throw new Error(o.SAME_ASSET);
  if (i.chain === n.bitcoin || i.chain === n.bitcoin_testnet || i.chain === n.bitcoin_regtest) {
    const t = e[r.chain];
    return `${n[i.chain]}-${n[r.chain]}:${a[t].AtomicSwap}`;
  } else {
    const t = e[i.chain];
    return `${n[i.chain]}:${a[t].AtomicSwap}-${n[r.chain]}`;
  }
}, e = {
  ethereum: 1,
  ethereum_sepolia: 11155111,
  ethereum_arbitrum: 42161
}, d = Object.entries(
  e
).reduce((i, [r, c]) => (i[c] = r, i), {});
export {
  e as chainToId,
  d as idToChain,
  u as orderPairGenerator
};
