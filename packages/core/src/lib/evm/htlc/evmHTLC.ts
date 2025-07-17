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
import { IHTLCWallet } from '../../htlc.interface';

export class EVMHTLC implements IHTLCWallet {
  private swap: Required<AtomicSwapConfig>;
  private readonly wallet: WalletClient;

  /**
   * @constructor
   * @param {EVMSwapConfig} swap - Atomic swap config, chain must be provided
   * @param {IEVMWallet} wallet
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
   * Initiates the HTLC
   *
   * @returns {Promise<string>} Transaction ID
   */
  async init(): Promise<string> {
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
    if (allowance < this.swap.amount) {
      await erc20.write.approve([this.swap.contractAddress, maxUint256], {
        account,
        chain: this.wallet.chain,
      });
    }

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
