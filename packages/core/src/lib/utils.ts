import {
  arbitrum,
  arbitrumSepolia,
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
import { sha256, WalletClient } from 'viem';
import * as varuint from 'varuint-bitcoin';
import { Err, Ok, trim0x } from '@catalogfi/utils';
import * as secp256k1 from 'tiny-secp256k1';

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
 * concats the leaf version, the length of the script, and the script itself
 */
export function serializeScript(leafScript: Buffer) {
  return Buffer.concat([
    Uint8Array.from([0xc0]),
    prefixScriptLength(leafScript),
  ]);
}

/**
 * concats the length of the script and the script itself
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

export const ChainToID: Record<EvmChain, viemChain> = {
  ethereum: mainnet,
  ethereum_arbitrum: arbitrum,
  ethereum_sepolia: sepolia,
  arbitrum_sepolia: arbitrumSepolia,
  ethereum_localnet: EthereumLocalnet,
  arbitrum_localnet: ArbitrumLocalnet,
};

/**
 * Switches or adds a network to the wallet
 * @param chain Garden supported chain
 * @param walletClient
 * @returns
 */
export const switchOrAddNetwork = async (
  chain: Chain,
  walletClient: WalletClient,
) => {
  const chainID = ChainToID[chain as EvmChain];
  if (chainID) {
    try {
      if (chainID.id === walletClient.chain?.id) {
        return Ok('Already on chain');
      }
      // switch the chain first
      await walletClient.switchChain({ id: chainID.id });
      return Ok('Switched chain');
    } catch (error) {
      // If switching fails, attempt to add the network
      if (isChainNotFoundError(error)) {
        try {
          await walletClient.addChain({ chain: chainID });
          return Ok('Added and switched chain');
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
