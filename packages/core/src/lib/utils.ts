import {
  arbitrum,
  arbitrumSepolia,
  baseSepolia,
  mainnet,
  sepolia,
  Chain as viemChain,
} from 'viem/chains';

import { IBaseWallet } from '@catalogfi/wallets';
import { with0x } from '@gardenfi/utils';
import {
  ArbitrumLocalnet,
  Chain,
  EthereumLocalnet,
  EvmChain,
} from '@gardenfi/orderbook';
import { createWalletClient, custom, sha256, WalletClient } from 'viem';
import * as varuint from 'varuint-bitcoin';
import { AsyncResult, Err, Ok, trim0x } from '@catalogfi/utils';
import * as secp256k1 from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

interface EthereumWindow extends Window {
  ethereum?: any;
}
declare const window: EthereumWindow;

export const computeSecret = async (
  fromChain: Chain,
  toChain: Chain,
  wallets: Partial<Record<Chain, IBaseWallet>>,
  nonce: number,
) => {
  const initiatorWallet = wallets[fromChain as Chain];
  const followerWallet = wallets[toChain as Chain];
  if (!followerWallet) throw new Error(`No ${fromChain} wallet found`);
  if (!initiatorWallet) throw new Error(`No ${toChain} wallet found`);

  let sig = undefined;
  if (isFromChainBitcoin(fromChain)) {
    const msg = sha256(
      with0x(
        Buffer.from(
          'catalog.js' + nonce + (await followerWallet.getAddress()),
        ).toString('hex'),
      ),
    ).slice(2);
    sig = await initiatorWallet.sign(msg);
  } else {
    const msg = sha256(
      with0x(
        Buffer.from(
          'catalog.js' + nonce + (await initiatorWallet.getAddress()),
        ).toString('hex'),
      ),
    ).slice(2);
    sig = await followerWallet.sign(msg);
  }

  return trim0x(sha256(with0x(sig)));
};

export const isFromChainBitcoin = (chain: Chain) => {
  return (
    chain === 'bitcoin' ||
    chain === 'bitcoin_testnet' ||
    chain === 'bitcoin_regtest'
  );
};

/**
 * Given a hex string or a buffer, return the x-only pubkey. (removes y coordinate the prefix)
 */
export function xOnlyPubkey(pubkey: Buffer | string): Buffer {
  if (typeof pubkey === 'string') pubkey = Buffer.from(pubkey, 'hex');
  return pubkey.length === 32 ? pubkey : pubkey.subarray(1, 33);
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * concat the leaf version, the length of the script, and the script itself
 */
export function serializeScript(leafScript: Buffer) {
  return Buffer.concat([
    Uint8Array.from([0xc0]),
    prefixScriptLength(leafScript),
  ]);
}

/**
 * concat the length of the script and the script itself
 */
export function prefixScriptLength(s: Buffer): Buffer {
  const varintLen = varuint.encodingLength(s.length);
  const buffer = Buffer.allocUnsafe(varintLen);
  varuint.encode(s.length, buffer);
  return Buffer.concat([buffer, s]);
}

export function sortLeaves(leaf1: Buffer, leaf2: Buffer) {
  if (leaf1.compare(leaf2) > 0) {
    const temp = leaf1;
    leaf1 = leaf2;
    leaf2 = temp;
  }
  return [leaf1, leaf2];
}

export const toXOnly = (pubKey: string) =>
  pubKey.length === 64 ? pubKey : pubKey.slice(2);

export const isValidBitcoinPubKey = (pubKey: string): boolean => {
  if (!pubKey) return false;

  try {
    const pubKeyBuffer = Buffer.from(pubKey, 'hex');
    return secp256k1.isPoint(pubKeyBuffer);
  } catch (e) {
    return false;
  }
};

export const evmToViemChainMap: Record<EvmChain, viemChain> = {
  ethereum: mainnet,
  ethereum_arbitrum: arbitrum,
  ethereum_sepolia: sepolia,
  arbitrum_sepolia: arbitrumSepolia,
  ethereum_localnet: EthereumLocalnet,
  arbitrum_localnet: ArbitrumLocalnet,
  base_sepolia: baseSepolia,
};

/**
 * Switches or adds a network to the wallet
 * @param chain Garden supported chain
 * @param walletClient
 * @returns new walletClient with updated chain
 */
export const switchOrAddNetwork = async (
  chain: Chain,
  walletClient: WalletClient,
): AsyncResult<{ message: string; walletClient: WalletClient }, string> => {
  const chainID = evmToViemChainMap[chain as EvmChain];
  if (chainID) {
    try {
      if (chainID.id === walletClient.chain?.id) {
        return Ok({ message: 'Already on the network', walletClient });
      }
      // switch the chain first
      await walletClient.switchChain({ id: chainID.id });
      const newWalletClient = createWalletClient({
        account: walletClient.account,
        chain: chainID,
        transport: custom(window.ethereum!),
      });

      return Ok({
        message: 'Switched chain',
        walletClient: newWalletClient as WalletClient,
      });
    } catch (error) {
      // If switching fails, attempt to add the network
      if (isChainNotFoundError(error)) {
        try {
          await walletClient.addChain({ chain: chainID });
          const newWalletClient = createWalletClient({
            account: walletClient.account,
            chain: chainID,
            transport: custom(window.ethereum!),
          });

          return Ok({
            message: 'Added network',
            walletClient: newWalletClient as WalletClient,
          });
        } catch (addError) {
          return Err('Failed to add network');
        }
      } else {
        return Err('Failed to switch network');
      }
    }
  } else {
    return Err('Chain not supported');
  }
};

const isChainNotFoundError = (error: unknown): error is { code: number } => {
  // Error code 4902 indicates the chain is not available in the wallet
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as any).code === 4902
  );
};

export const constructOrderPair = (
  sourceChain: Chain,
  sourceAsset: string,
  destChain: Chain,
  destAsset: string,
) =>
  sourceChain +
  ':' +
  sourceAsset.toLowerCase() +
  '::' +
  destChain +
  ':' +
  destAsset.toLowerCase();

export function validateBTCAddress(
  address: string,
  network: bitcoin.networks.Network,
) {
  if (!address) return false;
  bitcoin.initEccLib(ecc);
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch (e) {
    // console.error(e);
    return false;
  }
}
