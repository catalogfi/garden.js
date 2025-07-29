import {
  AccountInterface,
  cairo,
  Contract,
  RpcProvider,
  TransactionExecutionStatus,
} from 'starknet';
import { TokenABI } from './abi/starknetTokenABI';
import { AsyncResult, Err, Ok, sleep, with0x } from '@gardenfi/utils';

export const checkAllowanceAndApprove = async (
  account: AccountInterface,
  tokenAddress: string,
  htlcAddress: string,
  amount: bigint,
  starknetProvider: RpcProvider,
): AsyncResult<string, string> => {
  try {
    const allowance = await checkAllowance(
      account.address,
      tokenAddress,
      htlcAddress,
      starknetProvider,
    );
    if (!allowance.ok) return Err(allowance.error);

    const currentAllowance = allowance.val;

    if (currentAllowance >= amount) {
      return Ok('Allowance already approved');
    }
    const amountUint256 = cairo.uint256(BigInt(amount));
    const approveResponse = await account.execute([
      {
        contractAddress: with0x(tokenAddress),
        entrypoint: 'approve',
        calldata: [with0x(htlcAddress), amountUint256.low, amountUint256.high],
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

    // Verify allowance updated correctly (retry for up to 40 seconds)
    for (let i = 0; i < 20; i++) {
      const _allowance = await checkAllowance(
        account.address,
        tokenAddress,
        htlcAddress,
        starknetProvider,
      );
      if (!_allowance.ok) return Err(_allowance.error);
      if (_allowance.val >= amount) {
        return Ok(approveResponse.transaction_hash);
      }
      await sleep(2000);

      // in a loop check if the allowance is approved for every 2 sec until 40sec and exit
      let allowance = 0n;
      for (let i = 0; i < 20; i++) {
        const _allowance = await checkAllowance(
          account.address,
          tokenAddress,
          htlcAddress,
          starknetProvider,
        );
        if (!_allowance.ok) return Err(_allowance.error);
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

    return Err('Allowance not approved after transaction.');
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
  starknetProvider: RpcProvider,
): AsyncResult<bigint, string> => {
  try {
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

export const isAllowanceSufficient = async (
  accountAddress: string,
  tokenAddress: string,
  htlcAddress: string,
  starknetProvider: RpcProvider,
  amount: bigint,
): AsyncResult<boolean, string> => {
  const allowance = await checkAllowance(
    accountAddress,
    tokenAddress,
    htlcAddress,
    starknetProvider,
  );
  if (!allowance.ok) return Err(allowance.error);

  return Ok(allowance.val >= amount);
};
