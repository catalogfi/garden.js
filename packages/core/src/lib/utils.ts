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
  } catch (e) {
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
    default:
      throw new Error(`Invalid bitcoin network ${network}`);
  }
};

export const formatStarknetSignature = (value: Signature) => {
  // Handle object format
  if (typeof value === 'object' && 'r' in value && 's' in value) {
    return Ok([value.r.toString(), value.s.toString()]);
  }

  // Handle array format
  if (Array.isArray(value)) {
    if (value.length < 3) return Err('Invalid signature length');
    // If array length is 3, return last two values as [r, s]
    /**
     * 
     * if the length is 3 it is braavos wallet signature format which doesn't have public key and number of signers
     * [
      "1",
    "1397143895404075508936944356003143689047557551326484990082294792268036007513",
    "3349251680103955626256385099327904987172866494101233942670984344700799940807"
]
     */
    if (value.length === 3) {
      return Ok([value[1], value[2]]);
    }

    // Get number of signatures from first element
    /**
     * for argentX gaurdian account and other smart wallet accounts it will have atleast 5 and more than that based on the number of signers the account has
     * [
     * 
    "2",
    "0",
    "3110252091434162898955592158301035810375222512166513837071308032702453555343",
    "923648691038969237637610266832990816009421370765529594613068607580470687166" - r1,
    "2505324274416372764593918179311311859444197600215142191583887251012240964880" - s1,
    "0",
    "1767017484118352246184616171749889718076041796854226187659186123550126699123",
    "526758090264781317553605607284059479343300536052962560516394204590347566536" - r2,
    "1509230547367219669226859762147642072098535158080045416549616491239821516502" - s2
]
     */

    const numSignatures = parseInt(value[0]);
    if (isNaN(numSignatures)) return Err('Invalid signature format');
    const VALUES_PER_SIGNATURE = 4;
    if (value.length !== numSignatures * VALUES_PER_SIGNATURE + 1)
      return Err('Invalid signature format');
    const result: string[] = [];

    // Process based on number of signatures
    for (let i = 0; i < numSignatures; i++) {
      // Calculate the starting index for each signature group
      // Skip 2 values (public key and something) and get r,s
      const baseIndex = 1 + i * 4;
      const r = value[baseIndex + 2];
      const s = value[baseIndex + 3];
      if (r && s) {
        result.push(r, s);
      }
    }

    return Ok(result);
  }

  return Err('Invalid signature format');
};
