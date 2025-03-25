import { Account, cairo, Contract, RpcProvider } from 'starknet';
import { AsyncResult, Err, Ok, with0x } from '@catalogfi/utils';
import { TokenABI } from './abi/starknetTokenABI';

export const checkAllowanceAndApprove = async (
  account: Account,
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

    // console.log('Token contract initialized successfully');

    const allowanceResponse = await tokenContract.call('allowance', [
      with0x(account.address),
      with0x(htlcAddress),
    ]);

    const allowance = BigInt(allowanceResponse?.toString() || '0');
    const maxUint256 = cairo.uint256(BigInt(amount));

    // console.log(
    //   `Current Allowance: ${allowance}, Required: ${amount}, Max: ${maxUint256}`,
    // );

    if (allowance < amount) {
      // console.log('Approving maximum allowance (uint256 max)...');

      const approveResponse = await account.execute([
        {
          contractAddress: with0x(tokenAddress),
          entrypoint: 'approve',
          calldata: [htlcAddress, maxUint256.low, maxUint256.high],
        },
      ]);

      // console.log('Maximum approval successful:', approveResponse);
      return Ok(approveResponse.transaction_hash);
    }

    // console.log('Allowance already sufficient, no need to approve.');
    return Ok('Allowance already approved');
  } catch (error) {
    // console.error(' checkAllowanceAndApprove error:', error);
    return Err(
      `Failed to check or approve allowance: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};
