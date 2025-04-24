import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { erc20Abi, getContract, maxUint256, WalletClient } from 'viem';
import { with0x } from './utils';
import { waitForTransactionReceipt } from 'viem/actions';

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
      const receipt = await waitForTransactionReceipt(walletClient, {
        hash: res,
        timeout: 60000,
      });
      if (receipt.status !== 'success') return Err('Failed to approve');

      return Ok(res);
    }
    return Ok('Already approved');
  } catch (error) {
    return Err('Failed to approve: ' + error);
  }
};
