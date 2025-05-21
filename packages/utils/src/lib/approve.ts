import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import {
  erc20Abi,
  getContract,
  maxUint256,
  TransactionReceipt,
  WalletClient,
} from 'viem';
import { with0x } from './utils';
import { getTransactionReceipt } from 'viem/actions';

export const checkAllowanceAndApprove = async (
  amount: number,
  tokenAddress: string,
  contractAddress: string,
  walletClient: WalletClient,
): AsyncResult<string, string> => {
  if (!walletClient.account) return Err('No account found');

  const erc20Contract = getContract({
    address: with0x(tokenAddress),
    abi: erc20Abi,
    client: walletClient,
  });

  try {
    const allowance = await erc20Contract.read.allowance([
      with0x(walletClient.account.address),
      with0x(contractAddress),
    ]);

    if (BigInt(allowance) < BigInt(amount)) {
      const res = await erc20Contract.write.approve(
        [with0x(contractAddress), maxUint256],
        {
          account: walletClient.account,
          chain: walletClient.chain,
        },
      );

      const receipt = await waitForTransactionReceipt(walletClient, res);
      if (receipt.error) return Err(receipt.error);

      if (receipt.val.status !== 'success') return Err('Failed to approve');

      return Ok(res);
    }
    return Ok('Already approved');
  } catch (error) {
    return Err('Failed to approve: ' + error);
  }
};

export const waitForTransactionReceipt = async (
  walletClient: WalletClient,
  hash: `0x${string}`,
  interval = 2_000,
  timeout = 120_000,
): AsyncResult<TransactionReceipt, string> => {
  const maxAttempts = Math.ceil(timeout / interval);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const receipt = await getTransactionReceipt(walletClient, { hash });
      if (receipt) {
        return Ok(receipt);
      }
    } catch (err: unknown) {
      if (
        !(err as Error).message.includes(
          `Transaction receipt with hash "${hash}" could not be found.`,
        )
      ) {
        return Err((err as Error).message);
      }
    }

    // no receipt yet—wait before next attempt
    if (attempt < maxAttempts - 1) {
      await new Promise((res) => setTimeout(res, interval));
    }
  }
  return Err(`Timed out waiting for receipt of ${hash}`);
};
