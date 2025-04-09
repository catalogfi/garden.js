import {
  AccountInterface,
  cairo,
  Contract,
  RpcProvider,
  TransactionExecutionStatus,
  uint256,
} from 'starknet';
import { AsyncResult, Err, Ok, with0x } from '@catalogfi/utils';
import { TokenABI } from './abi/starknetTokenABI';

export const checkAllowanceAndApprove = async (
  account: AccountInterface,
  tokenAddress: string,
  htlcAddress: string,
  amount: bigint,
  nodeUrl: string,
): AsyncResult<string, string> => {
  try {
    const starknetProvider = new RpcProvider({
      nodeUrl: nodeUrl,
    });

    const tokenContract = new Contract(
      TokenABI,
      with0x(tokenAddress),
      starknetProvider,
    );

    const allowanceResponse = await tokenContract.call('allowance', [
      with0x(account.address),
      with0x(htlcAddress),
    ]);

    const allowance = BigInt(allowanceResponse?.toString() || '0');
    const maxUint256 = cairo.uint256(BigInt(uint256.UINT_256_MAX));

    if (allowance < amount) {
      const approveResponse = await account.execute([
        {
          contractAddress: with0x(tokenAddress),
          entrypoint: 'approve',
          calldata: [htlcAddress, maxUint256.low, maxUint256.high],
        },
      ]);

      await starknetProvider.waitForTransaction(
        approveResponse.transaction_hash,
        {
          retryInterval: 3000,
          successStates: [TransactionExecutionStatus.SUCCEEDED],
        },
      );
      return Ok(approveResponse.transaction_hash);
    }

    return Ok('Allowance already approved');
  } catch (error) {
    return Err(
      `Failed to check or approve allowance: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};
