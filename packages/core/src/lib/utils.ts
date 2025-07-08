import { BitcoinNetwork, IBaseWallet } from '@catalogfi/wallets';
import { Environment, Err, Ok, with0x } from '@gardenfi/utils';
import { Chain } from '@gardenfi/orderbook';
import { sha256 } from 'viem';
import * as varuint from 'varuint-bitcoin';
import { trim0x } from '@catalogfi/utils';
import * as secp256k1 from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Signature } from 'starknet';
import { API, Api } from './constants';
import { ApiConfig } from './garden/garden.types';
import { web3 } from '@coral-xyz/anchor';

export function resolveApiConfig(env: ApiConfig): {
  api: Api;
  environment: Environment;
} {
  const environment = typeof env === 'string' ? env : env.environment;

  const baseApi =
    environment === Environment.MAINNET
      ? API.mainnet
      : Environment.TESTNET
      ? API.testnet
      : API.localnet;

  const api: Api =
    typeof env === 'string'
      ? baseApi
      : {
          ...baseApi,
          ...env,
        };

  return { api, environment };
}

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
  } catch {
    return false;
  }
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

export function validateBTCAddress(address: string, networkType: Environment) {
  if (!address) return false;
  const network =
    networkType === Environment.MAINNET
      ? bitcoin.networks.bitcoin
      : networkType === Environment.TESTNET
      ? bitcoin.networks.testnet
      : bitcoin.networks.regtest;

  if (!network) return false;
  bitcoin.initEccLib(ecc);
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch {
    // console.error(e);
    return false;
  }
}

export const getBitcoinNetwork = (network: Environment): BitcoinNetwork => {
  switch (network) {
    case Environment.MAINNET:
      return BitcoinNetwork.Mainnet;
    case Environment.TESTNET:
      return BitcoinNetwork.Testnet;
    case Environment.LOCALNET:
      return BitcoinNetwork.Regtest;
    default:
      throw new Error(`Invalid bitcoin network ${network}`);
  }
};

export const isHexString = (value: string): boolean => {
  const hex = value.toLowerCase().replace('0x', '');
  return /^[0-9a-f]+$/.test(hex);
};

export const formatStarknetSignature = (sig: Signature) => {
  // Handle object format
  if (typeof sig === 'object' && 'r' in sig && 's' in sig) {
    return Ok([sig.r.toString(), sig.s.toString()]);
  }

  // Handle array format
  if (Array.isArray(sig)) {
    const result = sig.map((value) => {
      if (typeof value === 'string' && value.startsWith('0x')) {
        if (isHexString(value)) {
          return BigInt(value).toString();
        }
      }
      return value;
    });
    return Ok(result);
  }

  return Err('Invalid signature format');
};

export const waitForSolanaTxConfirmation = async (
  connection: web3.Connection,
  txHash: string,
): Promise<boolean> => {
  const startTime = Date.now();
  const MAX_DURATION = 30_000;
  const RETRY_INTERVAL = 2_000;

  while (Date.now() - startTime < MAX_DURATION) {
    const latestBlockhash = await connection.getLatestBlockhash();

    const confirmation = await connection.confirmTransaction(
      {
        signature: txHash,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    );

    if (confirmation.value && confirmation.value.err == null) {
      console.log('Tx Confirmed ✅');
      return true;
    }

    console.log('Tx not confirmed yet. Retrying in 2 seconds...');
    await new Promise((res) => setTimeout(res, RETRY_INTERVAL));
  }

  return false;
};
