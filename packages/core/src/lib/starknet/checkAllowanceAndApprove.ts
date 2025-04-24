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
import { sleep } from '@gardenfi/utils';

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

    const allowance = await checkAllowance(
      account.address,
      tokenAddress,
      htlcAddress,
      nodeUrl,
    );
    if (allowance.error) return Err(allowance.error);

    const maxUint256 = cairo.uint256(BigInt(uint256.UINT_256_MAX));

    if (allowance.val < amount) {
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
      await sleep(2000);

      // in a loop check if the allowance is approved for every 2 sec until 40sec and exit
      let allowance = 0n;
      for (let i = 0; i < 20; i++) {
        const _allowance = await checkAllowance(
          account.address,
          tokenAddress,
          htlcAddress,
          nodeUrl,
        );
        if (_allowance.error) return Err(_allowance.error);
        allowance = _allowance.val;
        if (allowance >= amount) {
          break;
        }
        await sleep(2000);
      }
      if (allowance < amount) {
        return Err('Allowance not approved');
      }

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

export const checkAllowance = async (
  accountAddress: string,
  tokenAddress: string,
  htlcAddress: string,
  nodeUrl: string,
): AsyncResult<bigint, string> => {
  try {
    const starknetProvider = new RpcProvider({
      nodeUrl: nodeUrl,
    });

    const tokenContract = new Contract(
      TokenABI,
      with0x(tokenAddress),
      starknetProvider,
    );

    const allowance = await tokenContract.call('allowance', [
      with0x(accountAddress),
      with0x(htlcAddress),
    ]);

    return Ok(BigInt(allowance?.toString() || '0'));
  } catch (error) {
    return Err(
      `Failed to check allowance: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};
