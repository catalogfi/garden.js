import { networks } from 'bitcoinjs-lib';
import { BitcoinNetwork } from './provider.interface';
import { validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { BitcoinPaths } from './bitcoinPaths';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';

export function getBitcoinNetwork(network: BitcoinNetwork) {
  if (network === BitcoinNetwork.Mainnet) {
    return networks.bitcoin;
  } else if (network === BitcoinNetwork.Testnet) {
    return networks.testnet;
  } else if (network === BitcoinNetwork.Regtest) {
    return networks.regtest;
  }
  throw new Error('Invalid network');
}

//use BitcoinPaths to generate path
export function mnemonicToPrivateKey(
  mnemonic: string,
  network: BitcoinNetwork,
  opts?: { index?: number; path?: string },
): string {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }
  const path = opts?.path ?? BitcoinPaths.bip44(network, opts?.index ?? 0);
  const node = BIP32Factory(ecc).fromSeed(mnemonicToSeedSync(mnemonic));
  const pk = pkFromNode(node, path);
  return pk;
}

const pkFromNode = (node: BIP32Interface, path: string) => {
  const pk = node.derivePath(path).privateKey;
  if (!pk) {
    throw new Error('Unable to derive private key from mnemonic');
  }
  return pk.toString('hex');
};
