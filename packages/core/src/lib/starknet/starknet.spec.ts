import { RpcProvider, Contract, num, Account, cairo, hash, ec } from 'starknet';
import { describe, it, expect, beforeEach } from 'vitest';
import { parseEther, sha256 } from 'viem';
import { randomBytes } from 'crypto';
import { createWalletClient, custom } from 'viem';

export function hexToU32Array(
  hexString: string,
  endian: 'big' | 'little' = 'big',
): number[] {
  // Remove 0x prefix if present
  hexString = hexString.replace('0x', '');

  // Ensure we have 64 characters (32 bytes, will make 8 u32s)
  if (hexString.length !== 64) {
    throw new Error('Invalid hash length');
  }

  const result: number[] = [];

  // Process 8 bytes (32 bits) at a time to create each u32
  for (let i = 0; i < 8; i++) {
    // Take 8 hex characters (4 bytes/32 bits)
    const chunk = hexString.slice(i * 8, (i + 1) * 8);

    // Split into bytes
    const bytes = chunk.match(/.{2}/g)!;

    // Handle endianness
    if (endian === 'little') {
      bytes.reverse();
    }

    const finalHex = bytes.join('');
    result.push(parseInt(finalHex, 16));
  }

  return result; // Will be array of 8 u32 values
}

describe('StarkNet Implementation Tests', () => {
  // Test constants
  const STARK =
    '0x643f195b81ec394f97de5911165cea856788fb48b9ae4d0bc8778a94294b';
  const PRIVATE_KEY =
    '0x00000000000000000000000000000000c10662b7b247c7cecf7e8a30726cff12';
  const ADDRESS =
    '0x0260a8311b4f1092db620b923e8d7d20e76dedcc615fb4b6fdf28315b81de201';
  const PROVIDER_URL = 'https://starknet-sepolia.public.blastapi.io';

  // Test hexToU32Array function
  describe('hexToU32Array Function', () => {
    it('should correctly convert hex string to u32 array', () => {
      const testHex =
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = hexToU32Array(testHex);

      expect(result).toHaveLength(8);
      expect(Array.isArray(result)).toBe(true);
      // console.log('Converted U32 Array:', result);
    });

    it('should handle 0x prefix correctly', () => {
      const testHex =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = hexToU32Array(testHex);

      expect(result).toHaveLength(8);
      // console.log('Converted U32 Array with 0x prefix:', result);
    });

    it('should throw error for invalid length', () => {
      const invalidHex = '1234';
      expect(() => hexToU32Array(invalidHex)).toThrow('Invalid hash length');
    });
  });

  // Test Contract Interaction
  describe('Contract Interaction', () => {
    let provider: RpcProvider;
    let account: Account;
    let contract: Contract;

    beforeEach(async () => {
      provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
      account = new Account(provider, ADDRESS, PRIVATE_KEY);
      console.log('Account created:', account.address);
    });
    // provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
    // account = new Account(provider, ADDRESS, PRIVATE_KEY);
    // const starkNetAccount: Account = {
    //   address: account.address as `0x${string}`,
    //   async sign({ hash: msgHash }) {
    //     const signature = ec.sign(PRIVATE_KEY, msgHash);
    //     // Viem expects the signature as a single `0x` string
    //     return `0x${signature.r}${signature.s}`;
    //   },
    //   async signTransaction(txn) {
    //     const txnHash = hash.computeTransactionHash(txn);
    //     const signature = ec.sign(PRIVATE_KEY, txnHash);
    //     return `0x${signature.r}${signature.s}`;
    //   },
    //   async signMessage(message) {
    //     const msgHash = hash.computeMessageHash(message);
    //     const signature = ec.sign(PRIVATE_KEY, msgHash);
    //     return `0x${signature.r}${signature.s}`;
    //   },
    //   async getAddress() {
    //     return account.address as `0x${string}`;
    //   },
    // };

    // const starkWalletclient = createWalletClient({
    //   chain: { id: 10001, name: 'starknet' },
    //   transport: custom({ request: account.fetch.bind(account) }),
    //   account: starkNetAccount,
    // });

    it('should connect to provider', async () => {
      const chainId = await provider.getChainId();
      console.log('Connected to chain:', chainId);
      expect(chainId).toBeDefined();
    });

    it('should get contract and token data', async () => {
      const contractData = await provider.getClassAt(STARK);
      contract = new Contract(contractData.abi, STARK, provider);
      console.log('Contract connected:', contract.address);

      const token = await contract.token();
      const tokenHex = '0x' + num.toHex(token).replace('0x', '');
      console.log('Token address:', tokenHex);

      expect(tokenHex).toBeDefined();
    });
  });

  // Test Swap Initialization
  describe('Swap Initialization', () => {
    it('should prepare swap parameters', async () => {
      // Generate secret and hash
      const secret = sha256(randomBytes(32));
      // console.log('Generated Secret:', secret);

      const secretHash = hexToU32Array(sha256(secret));
      console.log('Secret Hash (U32 Array):', secretHash);

      // Prepare amount parameters
      const { low, high } = cairo.uint256(parseEther('1'));
      console.log('Amount parameters:', { low, high });

      expect(secretHash).toHaveLength(8);
      expect(low).toBeDefined();
      expect(high).toBeDefined();
    });

    it('should prepare transaction parameters', async () => {
      const provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
      const account = new Account(provider, ADDRESS, PRIVATE_KEY);

      // Check account deployment status
      try {
        const accountClass = await provider.getClassAt(account.address);
        console.log('Account deployed:', !!accountClass);
      } catch (error) {
        console.log('Account not deployed');
      }

      // Get account nonce
      const nonce = await account.getNonce();
      console.log('Account nonce:', nonce);
    });
  });

  // Test Contract Communication
  describe('Contract Communication', () => {
    let provider: RpcProvider;
    let account: Account;
    let contract: Contract;

    beforeEach(async () => {
      provider = new RpcProvider({ nodeUrl: PROVIDER_URL });
      account = new Account(provider, ADDRESS, PRIVATE_KEY);
      const contractData = await provider.getClassAt(STARK);
      contract = new Contract(contractData.abi, STARK, provider);
      contract.connect(account);
    });

    it('should initiate swap transaction', async () => {
      const secret = sha256(randomBytes(32));
      const secretHash = hexToU32Array(sha256(secret));
      const { low, high } = cairo.uint256(parseEther('0.1'));

      try {
        const result = await account.execute({
          contractAddress: STARK,
          entrypoint: 'initiate',
          calldata: [
            '0x018f81c2ef42310e0abd4fafd27f37beb34d000641beb2cd8a6fb97596552ddb',
            900n,
            low,
            high,
            secretHash,
          ],
        });

        console.log('Transaction result:', result);
        expect(result.transaction_hash).toBeDefined();
      } catch (error: any) {
        console.error('Transaction error:', error);
        throw error;
      }
    });

    it('should execute redeem transaction', async () => {
      const secret = sha256(randomBytes(32));
      try {
        const result = await contract.redeem(hexToU32Array(secret));
        console.log('Redeem result:', result);
        expect(result.transaction_hash).toBeDefined();
      } catch (error: any) {
        console.error('Redeem error:', error);
        throw error;
      }
    });

    it('should check contract methods', async () => {
      try {
        const methods = await contract.functions;
        console.log('Available contract methods:', methods);
        expect(methods).toBeDefined();
      } catch (error) {
        console.error('Error getting contract methods:', error);
        throw error;
      }
    });
  });

  // Test Transaction Execution (commented out to prevent actual transactions)
  describe('Transaction Execution (Dry Run)', () => {
    it('should prepare transaction payload', async () => {
      const secret = sha256(randomBytes(32));
      const secretHash = hexToU32Array(sha256(secret));
      const { low, high } = cairo.uint256(parseEther('1'));

      const calldata = [
        '0x018f81c2ef42310e0abd4fafd27f37beb34d000641beb2cd8a6fb97596552ddb',
        900n,
        low,
        high,
        ...secretHash,
      ];

      // console.log('Transaction payload prepared:', {
      //   contractAddress: STARK,
      //   entrypoint: 'initiate',
      //   calldata,
      // });

      expect(calldata).toBeDefined();
      expect(calldata.length).toBeGreaterThan(4);
    });
  });
});
