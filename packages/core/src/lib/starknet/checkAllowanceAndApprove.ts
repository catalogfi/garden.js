import { Account, Contract, RpcProvider } from 'starknet';
import { AsyncResult, Err, Ok, with0x } from '@catalogfi/utils';

export const checkAllowanceAndApprove = async (
  account: Account,
  tokenAddress: string,
  htlcAddress: string,
  amount: bigint,
): AsyncResult<string, string> => {
  try {
    const starknetProvider = new RpcProvider({
      nodeUrl: 'http://localhost:8547',
    });

    console.log(' Fetching contract class for:', tokenAddress);
    const contractData = await starknetProvider.getClassAt(
      with0x(tokenAddress),
    );

    if (!contractData || !contractData.abi) {
      throw new Error(`Invalid contract data for token: ${tokenAddress}`);
    }

    console.log('Contract class fetched successfully');

    const tokenContract = new Contract(
      contractData.abi,
      with0x(tokenAddress),
      starknetProvider,
    );

    console.log('Token contract initialized successfully');

    const allowanceResponse = await tokenContract.call('allowance', [
      with0x(account.address),
      with0x(htlcAddress),
    ]);

    const allowance = BigInt(allowanceResponse?.toString() || '0');
    const maxUint256 = 2n ** 256n - 1n;

    console.log(`Current Allowance: ${allowance}, Required: ${amount}, Max: ${maxUint256}`);

    if (allowance < amount) {
      console.log('Approving maximum allowance (uint256 max)...');

      const amountUint256 = {
        low: maxUint256 & ((1n << 128n) - 1n),
        high: maxUint256 >> 128n,
      };

      const approveResponse = await account.execute([
        {
          contractAddress: with0x(tokenAddress),
          entrypoint: 'approve',
          calldata: [
            htlcAddress,
            amountUint256.low.toString(),
            amountUint256.high.toString(),
          ],
        },
      ]);

      console.log('Maximum approval successful:', approveResponse);
      return Ok(approveResponse.transaction_hash);
    }

    console.log('Allowance already sufficient, no need to approve.');
    return Ok('Allowance already approved');
  } catch (error) {
    console.error(' checkAllowanceAndApprove error:', error);
    return Err(
      `Failed to check or approve allowance: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};
