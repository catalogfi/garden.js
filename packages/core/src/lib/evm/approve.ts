import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { erc20Abi, getContract, maxUint256, WalletClient } from 'viem';
// import { with0x } from '@gardenfi/utils';
import { waitForTransactionReceipt } from 'viem/actions';

const with0x = (str: string): `0x${string}` => {
  if (str.startsWith('0x')) return str as `0x${string}`;
  return `0x${str}`;
};

export const checkAllowanceAndApprove = async (
  amount: number | bigint,
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

    console.log('Current Allowance:', allowance.toString());
    console.log('Required Amount:', amount.toString());

    const allowanceBigInt = BigInt(allowance);
    const amountBigInt = BigInt(amount);

    if (allowanceBigInt < amountBigInt) {
      console.log('Insufficient allowance, approving...');
      console.log(contractAddress, walletClient.account.address);
      const res = await erc20Contract.write.approve(
        [with0x(contractAddress), maxUint256],
        {
          account: walletClient.account,
          chain: walletClient.chain,
          gas: 100000n, // Add explicit gas limit
          maxFeePerGas: 2000000000n, // 2 gwei
          maxPriorityFeePerGas: 1500000000n, // 1.5 gwei
        },
      );
      console.log('hey daddy');
      const receipt = await waitForTransactionReceipt(walletClient, {
        hash: res,
      });
      if (receipt.status !== 'success') return Err('Failed to approve');

      return Ok(res);
    }
    console.log('Allowance already sufficient, no need to approve.');
    return Ok('Already approved');
  } catch (error) {
    console.error('Approval error:', error);
    return Err('Failed to approve: ' + error);
  }
};
