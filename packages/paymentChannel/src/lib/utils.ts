import {
  JsonRpcSigner,
  Wallet,
  JsonRpcApiProvider,
  TypedDataField,
  Block,
} from 'ethers';
import {
  ConditionalPaymentInitialRequest,
  Channel,
} from './paymentChannel.types';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { createHash } from 'crypto';

export const getProviderOrThrow = (signer: JsonRpcSigner | Wallet) => {
  if (signer.provider && signer.provider instanceof JsonRpcApiProvider) {
    return Ok(signer.provider);
  }
  return Err('Provider (JsonRpcApiProvider) not found in the signer');
};

export const parseError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return error?.toString() ?? 'Unknown error';
};

export const signPayment = async (
  channel: Channel,
  paymentRequest: ConditionalPaymentInitialRequest,
  signer: JsonRpcSigner | Wallet
) => {
  if (!signer.provider) throw new Error('Provider not found in the signer');
  const selectedChainId = (await signer.provider.getNetwork()).chainId;

  const types: Record<string, TypedDataField[]> = {
    Claim: [
      { name: 'nonce', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'htlcs', type: 'HTLC[]' },
    ],
    HTLC: [
      { name: 'secretHash', type: 'bytes32' },
      { name: 'timeLock', type: 'uint256' },
      { name: 'sendAmount', type: 'uint256' },
      { name: 'receiveAmount', type: 'uint256' },
    ],
  };

  const domain = {
    name: 'FEEAccount',
    version: '1',
    chainId: +selectedChainId.toString(),
    verifyingContract: channel.address,
  };

  const claim = {
    nonce: channel.latestState.nonce + 1,
    amount: channel.latestState.amount,
    htlcs: [
      ...channel.latestState.htlcs.map((htlc) => ({
        secretHash: htlc.secretHash.startsWith('0x')
          ? htlc.secretHash
          : '0x' + htlc.secretHash,
        timeLock: htlc.timeLock,
        sendAmount: htlc.sendAmount,
        receiveAmount: htlc.receiveAmount,
      })),
      paymentRequest,
    ],
  };

  return await signer.signTypedData(domain, types, claim);
};

export async function getTimelock(provider: JsonRpcApiProvider) {
  // currentBlock + (TWO_DAYS in ETH blocks)
  const network = (await provider.getNetwork()).chainId;
  let currentBlock = 0;
  if (network !== BigInt(1) && network !== BigInt(11155111)) {
    // this means we are not on mainnet or testnet
    // we need to fetch the block number via the provider
    // and use that as the timeLock
    const bNumber = await provider.send('eth_getBlockByNumber', [
      'latest',
      false,
    ]);
    currentBlock = parseInt(bNumber.result.number, 16);
  } else {
    currentBlock = await provider.getBlockNumber();
  }
  return currentBlock + 2 * 7200;
}

type BlockWithL1BlockNumber = Block & {
  l1BlockNumber: string;
};

export const getBlockNumber = async (
  provider: JsonRpcApiProvider
): AsyncResult<number, string> =>
  executeWithTryCatch(async () => {
    return await provider.getBlockNumber();
  });

export const getLatestBlock = async (
  provider: JsonRpcApiProvider
): AsyncResult<BlockWithL1BlockNumber | Block, string> => {
  const network = await provider.getNetwork();
  if (network.chainId === BigInt(42161)) {
    const block: BlockWithL1BlockNumber = await provider.send(
      'eth_getBlockByNumber',
      ['latest', false]
    );
    if (!block) return Err('Failed to get latest block');
    return Ok(block);
  }
  const block = await provider.getBlock('latest');
  if (!block) return Err('Failed to get latest block');
  return Ok(block);
};

/**
 * @param provider JSON RPC provider
 * @returns corresponding L1 block number for arbitrum network or block number for other networks
 */
export const getL1BlockNumber = async (
  provider: JsonRpcApiProvider
): AsyncResult<number, string> => {
  const network = await provider.getNetwork();
  if (network.chainId === BigInt(42161)) {
    const block = await getLatestBlock(provider);
    if (block.ok && 'l1BlockNumber' in block.val) {
      const blockNumber = parseInt(block.val.l1BlockNumber, 16);
      return Ok(blockNumber);
    }
  }
  return await getBlockNumber(provider);
};

/**
 *
 * @description checks if the duration has exceeded the given time
 * @param time the time to compare with
 * @returns boolean
 */
export const isDurationExceeded = (
  time: string,
  hours = 0,
  minutes = 0,
  seconds = 0
) =>
  (new Date().getTime() - new Date(time).getTime()) / 1000 >
  hours * 3600 + minutes * 60 + seconds;

/**
 * @description hashes a string using sha256
 * @param inputString the string to hash
 * @returns the hashed string
 */
export function hashString(inputString: string) {
  const sha256Hash = createHash('sha256');
  sha256Hash.update(inputString);
  const hashedString = sha256Hash.digest('hex');
  return hashedString;
}
