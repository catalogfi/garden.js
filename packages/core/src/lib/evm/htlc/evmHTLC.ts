import { AsyncResult, Ok, with0x } from '@gardenfi/utils';
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
import { IEVMHTLC } from '../htlc.types';

export class EVMHTLC implements IEVMHTLC {
  // private swap: Required<AtomicSwapConfig>;
  private readonly wallet: WalletClient;

  /**
   * @constructor
   * @param {EVMSwapConfig} swap - Atomic swap config, chain must be provided
   * @param {WalletClient} wallet
   */
  constructor(wallet: WalletClient) {
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

  async getHTLCContract(tokenAddress: string) {
    return getContract({
      address: with0x(tokenAddress),
      abi: AtomicSwapABI,
      client: this.wallet,
    });
  }

  get htlcActorAddress(): string {
    if (!this.wallet.account) throw new Error('No account found');
    return this.wallet.account.address;
  }

  async getERC20Contract(tokenAddress: string) {
    const token = await (await this.getHTLCContract(tokenAddress)).read.token();
    return getContract({
      address: token,
      abi: erc20Abi,
      client: this.wallet,
    });
  }

  /**
   * Initiates the HTLC with optional batching support
   *
   * @returns {Promise<string>} Transaction ID
   */
  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }

    const supportsBatch = await this.supportsBatching();
    console.log(
      supportsBatch ? 'Supports batching' : 'Does not support batching',
    );
    if (supportsBatch) {
      return this._initWithBatch(order);
    } else {
      return this._initTraditional(order);
    }
  }

  /**
   * Traditional initialization (approve + initiate separately)
   */
  private async _initTraditional(
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }
    const initiatorAddress = account.address;
    const erc20 = await this.getERC20Contract(order.source_swap.asset);
    const allowance = await erc20.read.allowance([
      initiatorAddress,
      with0x(order.source_swap.asset),
    ]);
    // Approve if needed
    if (allowance < BigInt(order.source_swap.amount)) {
      await erc20.write.approve([with0x(order.source_swap.asset), maxUint256], {
        account,
        chain: this.wallet.chain,
      });
    }
    const htlcContract = await this.getHTLCContract(order.source_swap.asset);
    // Initiate the swap
    const response = await htlcContract.write.initiate(
      [
        with0x(order.source_swap.redeemer),
        BigInt(order.create_order.timelock),
        BigInt(order.source_swap.amount),
        with0x(order.create_order.secret_hash),
      ],
      {
        account,
        chain: this.wallet.chain,
      },
    );
    return Ok(response);
  }

  /**
   * Batch initialization using Pectra capabilities (approve + initiate in one transaction)
   */
  private async _initWithBatch(
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }
    try {
      const erc20Contract = await this.getERC20Contract(
        order.source_swap.asset,
      );
      const htlcContract = await this.getHTLCContract(order.source_swap.asset);

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
          with0x(order.source_swap.redeemer),
          BigInt(order.create_order.timelock),
          BigInt(order.source_swap.amount),
          order.create_order.secret_hash as Hex,
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
      return Ok(id);
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
  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    secret = with0x(secret);
    const account = this.wallet.account;
    if (!account) {
      throw new Error('Account not found');
    }
    const sh = sha256(secret as Hex);
    const initiatorAddress = with0x(order.source_swap.initiator);

    const orderId = this.getOrderId(sh, initiatorAddress);
    const response = await (
      await this.getHTLCContract(order.source_swap.asset)
    ).write.redeem([orderId, secret as Hex], {
      account,
      chain: undefined,
    });
    return Ok(response);
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
  async refund(order: MatchedOrder): AsyncResult<string, string> {
    const initiatorAddress = order.source_swap.initiator;
    const orderId = this.getOrderId(
      with0x(order.create_order.secret_hash) as Hex,
      with0x(initiatorAddress),
    );

    const response = await (
      await this.getHTLCContract(order.source_swap.asset)
    ).write.refund([orderId], {
      account: with0x(initiatorAddress),
      chain: undefined,
    });

    return Ok(response);
  }
}
