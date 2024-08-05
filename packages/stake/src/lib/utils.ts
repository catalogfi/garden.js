import { AsyncResult, Err, Ok, Result } from '@catalogfi/utils';
import { erc20Abi, getContract, maxUint256, WalletClient } from 'viem';

export const convertTo0xString = (address: string): `0x${string}` => {
  const result = address.startsWith('0x') ? address : `0x${address}`;
  return result as `0x${string}`;
};

/**
 * @description approves the staking contract to spend the SEED tokens.
 */
export const checkAllowanceAndApprove = async (
  amount: number,
  tokenAddress: string,
  contractAddress: string,
  walletClient: WalletClient
): AsyncResult<string, string> => {
  if (!walletClient.account) return Err('No account found');

  const erc20Contract = getContract({
    address: convertTo0xString(tokenAddress),
    abi: erc20Abi,
    client: walletClient,
  });

  const accountAddress = await walletClient.getAddresses();
  if (!accountAddress[0]) return Err('No account found');

  try {
    const allowance = await erc20Contract.read.allowance([
      convertTo0xString(accountAddress[0]),
      convertTo0xString(contractAddress),
    ]);

    if (BigInt(allowance) < BigInt(amount)) {
      const res = await erc20Contract.write.approve(
        [convertTo0xString(contractAddress), maxUint256],
        {
          account: walletClient.account,
          chain: walletClient.chain,
        }
      );
      return Ok(res);
    }
    return Ok('Already approved');
  } catch (error) {
    return Err('Failed to approve: ' + error);
  }
};
