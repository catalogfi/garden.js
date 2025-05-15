import { Network, script, payments } from 'bitcoinjs-lib';
import { AtomicSwapConfig } from './ASConfig';
import { address as bitcoinjsAddress } from 'bitcoinjs-lib';
import { isErrorWithMessage } from '../utils';

export const getHTLCScript = (
  swapConfig: AtomicSwapConfig,
  network: Network,
  legacy = false,
) => {
  const getFormattedAddress = (address: string) => {
    try {
      address = bitcoinjsAddress.fromBech32(address).data.toString('hex');
    } catch (err) {
      if (isErrorWithMessage(err)) {
        if (
          err.message.includes('Mixed-case string') ||
          err.message.includes('too short')
        ) {
          address = bitcoinjsAddress
            .fromBase58Check(address)
            .hash.toString('hex');
        }
      } else throw new Error(String(err));
    }
    return address;
  };
  const htlcScript = script.fromASM(
    `
            OP_IF
                OP_SHA256
                ${swapConfig.secretHash}
                OP_EQUALVERIFY
                OP_DUP
                OP_HASH160
                ${getFormattedAddress(swapConfig.recipientAddress.address)}
            OP_ELSE
                ${script.number.encode(swapConfig.expiryBlocks).toString('hex')}
                OP_CHECKSEQUENCEVERIFY
                OP_DROP
                OP_DUP
                OP_HASH160
                ${getFormattedAddress(swapConfig.refundAddress.address)}
                OP_ENDIF
              OP_EQUALVERIFY
              OP_CHECKSIG
        `
      .trim()
      .replace(/\s+/g, ' '),
  );

  const p2wsh = payments[legacy ? 'p2sh' : 'p2wsh']({
    redeem: {
      output: htlcScript,
    },
    network,
  });
  if (!p2wsh.address) throw new Error('Could not build address');

  return {
    script: htlcScript,
    address: p2wsh.address,
  };
};
