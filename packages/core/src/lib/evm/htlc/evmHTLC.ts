import { IHTLCWallet } from '@catalogfi/wallets';
import {
  AtomicSwapConfig,
  EVMHTLCErrors,
  EVMSwapConfig,
} from './evmHTLC.types';
import { with0x } from '@gardenfi/utils';
import {
  Address,
  encodeAbiParameters,
  erc20Abi,
  getContract,
  Hex,
  maxUint256,
  parseAbiParameters,
  sha256,
  WalletClient,
} from 'viem';
import { AtomicSwapABI } from '../abi/atomicSwap';
import { getCapabilities } from 'src/lib/utils';
import { MatchedOrder } from '@gardenfi/orderbook';

export class EVMHTLC implements IHTLCWallet {
  private swap: Required<AtomicSwapConfig>;
  private readonly wallet: WalletClient;

  /**
   * @constructor
   * @param {EVMSwapConfig} swap - Atomic swap config, chain must be provided
   * @param {WalletClient} wallet
   */
  constructor(swap: EVMSwapConfig, wallet: WalletClient) {
    this.swap = {
      ...swap,
      contractAddress: swap.contractAddress,
    };
    this.swap.secretHash = with0x(this.swap.secretHash);

    if (this.swap.secretHash.length !== 66)
      throw new Error(EVMHTLCErrors.INVALID_SECRET_HASH);

    this.wallet = wallet;
  }

  /**
   * Check if the wallet supports batching transactions (Pectra EIP-7702)
   */
  private async supportsBatching(): Promise<boolean> {
    try {
      const chainId = this.wallet?.chain?.id;
      if (!chainId) return false;

      const capabilities = await getCapabilities(this.wallet);

      const supportsBatching =
        capabilities[chainId].atomic?.status === 'supported' ||
        capabilities[chainId].atomic?.status === 'ready';

      return supportsBatching;
    } catch {
      return false;
    }
  }

  async getHTLCContract() {
    return getContract({
      address: this.swap.contractAddress,
      abi: AtomicSwapABI,
      client: this.wallet,
    });
  }

  async getERC20Contract() {
    const token = await (await this.getHTLCContract()).read.token();
    return getContract({
      address: token,
      abi: erc20Abi,
      client: this.wallet,
    });
  }

  /**
   * The atomic swap contract address associated with the passed chain
   *
   * @returns {string} The contract address
   */
  id(): string {
    return this.swap.contractAddress;
  }

  /**
   * Initiates the HTLC with optional batching support
   *
   * @returns {Promise<string>} Transaction ID
   */
  async init(order: MatchedOrder): Promise<string> {
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }

    const supportsBatch = await this.supportsBatching();

    if (supportsBatch) {
      return this._initWithBatch(order);
    } else {
      return this._initTraditional(order);
    }
  }

  /**
   * Traditional initialization (approve + initiate separately)
   */
  private async _initTraditional(order: MatchedOrder): Promise<string> {
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }

    const initiatorAddress = account.address;
    const erc20 = await this.getERC20Contract();
    const allowance = await erc20.read.allowance([
      initiatorAddress,
      this.swap.contractAddress,
    ]);

    // Approve if needed
    if (allowance < this.swap.amount) {
      await erc20.write.approve([this.swap.contractAddress, maxUint256], {
        account,
        chain: this.wallet.chain,
      });
    }

    // Initiate the swap
    return (await this.getHTLCContract()).write.initiate(
      [
        this.swap.recipientAddress.unwrap_evm(),
        BigInt(this.swap.expiryBlocks),
        this.swap.amount,
        this.swap.secretHash as Hex,
      ],
      {
        account,
        chain: this.wallet.chain,
      },
    );
  }

  /**
   * Batch initialization using Pectra capabilities (approve + initiate in one transaction)
   */
  private async _initWithBatch(order: MatchedOrder): Promise<string> {
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }

    try {
      const erc20Contract = await this.getERC20Contract();
      const htlcContract = await this.getHTLCContract();

      // Simulate both transactions
      const approveTx = await erc20Contract.simulate.approve(
        [with0x(order.source_swap.asset), maxUint256],
        {
          account: account.address,
          chain: this.wallet.chain,
        },
      );

      const initiateTx = await htlcContract.simulate.initiate(
        [
          this.swap.recipientAddress.unwrap_evm(),
          BigInt(this.swap.expiryBlocks),
          this.swap.amount,
          this.swap.secretHash as Hex,
        ],
        {
          account: account.address,
        },
      );

      // Execute batch transaction using sendCalls
      const { id } = await this.wallet.sendCalls({
        account,
        chain: this.wallet.chain,
        calls: [
          { ...approveTx.request, to: approveTx.request.address },
          { ...initiateTx.request, to: initiateTx.request.address },
        ],
      });

      return id;
    } catch (err: any) {
      console.error('Batch initialization failed:', err);
      // Fallback to traditional method
      return this._initTraditional(order);
    }
  }

  /**
   * Redeems the HTLC
   *
   * @returns {Promise<string>} Transaction ID
   */
  async redeem(secret: string): Promise<string> {
    secret = with0x(secret);
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }
    const sh = sha256(secret as Hex);
    const initiatorAddress = this.swap.initiatorAddress;

    const orderId = this.getOrderId(sh, initiatorAddress.unwrap_evm());
    return (await this.getHTLCContract()).write.redeem(
      [orderId, secret as Hex],
      {
        account,
        chain: undefined,
      },
    );
  }

  private getOrderId(sh: Hex, addr: Address) {
    return sha256(
      encodeAbiParameters(parseAbiParameters(['bytes32', 'address']), [
        sh,
        addr,
      ]),
    );
  }

  /**
   * Refunds the HTLC
   *
   * @returns {Promise<string>} Transaction ID
   */
  async refund(): Promise<string> {
    const initiatorAddress = this.swap.initiatorAddress;
    const orderId = this.getOrderId(
      with0x(this.swap.secretHash) as Hex,
      initiatorAddress.unwrap_evm(),
    );

    return (await this.getHTLCContract()).write.refund([orderId], {
      account: initiatorAddress.unwrap_evm(),
      chain: undefined,
    });
  }
}
