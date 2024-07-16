import {
  JsonRpcSigner,
  Wallet,
  JsonRpcApiProvider,
  TypedDataField,
} from 'ethers';
import {
  ConditionalPaymentInitialRequest,
  PaymentChannelState,
} from './paymentChannel.types';

export const getProviderOrThrow = (signer: JsonRpcSigner | Wallet) => {
  if (signer.provider && signer.provider instanceof JsonRpcApiProvider) {
    return signer.provider;
  }
  throw new Error('Provider (JsonRpcApiProvider) not found in the signer');
};

export const parseError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return error?.toString() ?? 'Unknown error';
};

export const signPayment = async (
  channel: PaymentChannelState,
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
