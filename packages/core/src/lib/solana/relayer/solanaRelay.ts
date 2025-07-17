import { web3, AnchorProvider, Program } from '@coral-xyz/anchor';
import rawSplIdl from '../idl/spl/solana_spl_swaps.json';
import rawNativeIdl from '../idl/native/solana_native_swaps.json';
import { SolanaSplSwaps } from '../idl/spl/solana_spl_swaps';
import { SolanaNativeSwaps } from '../idl/native/solana_native_swaps';
import { SwapConfig, validateSecret } from '../solanaTypes';
import {
  APIResponse,
  AsyncResult,
  Err,
  Fetcher,
  Ok,
  Url,
} from '@gardenfi/utils';
import { ISolanaHTLC } from '../htlc/ISolanaHTLC';
import { isSolanaNativeToken, MatchedOrder } from '@gardenfi/orderbook';
import { waitForSolanaTxConfirmation } from '../../utils';
import * as Spl from "@solana/spl-token";

/**
 * A Relay is an endpoint that submits the transaction on-chain on one's behalf, paying any fees.
 * SolanaRelay is a unified implementation that performs atomic swaps for both SPL and native tokens.
 */
export class SolanaRelay implements ISolanaHTLC {
  /**
   * The on-chain Program Derived Address (PDA) that facilitates this swap.
   * A PDA represents an on-chain memory space. It can store SOL too and is owned by a program (that derived it).
   * This PDA stores the swap state (initiator, redeemer, secrethash etc) on-chain and also escrows the tokens/SOL.
   */
  private swapAccount?: web3.PublicKey;
  private splProgram: Program<SolanaSplSwaps>;
  private nativeProgram: Program<SolanaNativeSwaps>;
  private relayer: web3.PublicKey;

  /**
   * Creates a new instance of SolanaRelay.
   * @param {AnchorProvider} provider - An abstraction of RPC connection and a Wallet
   * @param {Url} endpoint - API endpoint of the relayer node
   * @param {string} relayer - On-chain address of the relayer in base58 format
   * @param {string} splProgramAddress - On-chain address of the SPL token swap program
   * @param {string} nativeProgramAddress - On-chain address of the native token swap program
   * @throws {Error} If any required parameters are missing or invalid
   */
  constructor(
    private provider: AnchorProvider,
    private url: Url,
    relayer: string,
    nativeProgramAddress: string,
    splProgramAddress: string,
  ) {
    if (!provider) throw new Error('Provider is required');
    if (!url) throw new Error('Endpoint URL is required');
    if (!relayer) throw new Error('Relayer address is required');

    try {
      this.relayer = new web3.PublicKey(relayer);
    } catch (cause) {
      throw new Error(
        'Error decoding relayer public key. Ensure it is base58 encoded.',
        { cause },
      );
    }

    // Initialize SPL program
    const splIdlWithAddress = {
      ...rawSplIdl,
      metadata: {
        ...(rawSplIdl.metadata ?? {}),
      },
      address: splProgramAddress,
    };

    // Initialize Native program
    const nativeIdlWithAddress = {
      ...rawNativeIdl,
      metadata: {
        ...(rawNativeIdl.metadata ?? {}),
      },
      address: nativeProgramAddress,
    };

    try {
      this.splProgram = new Program(
        (splIdlWithAddress as unknown) as SolanaSplSwaps,
        this.provider,
      );
      
      this.nativeProgram = new Program(
        (nativeIdlWithAddress as unknown) as SolanaNativeSwaps,
        this.provider,
      );
    } catch (cause) {
      throw new Error(
        'Error creating Program instances. Ensure the IDLs and provider are correct.',
        { cause },
      );
    }
  }

  /**
   * Gets the on-chain address of the current user's wallet.
   * @returns {string} The wallet's on-chain address in base58 format
   * @throws {Error} If no provider public key is found
   */
  get htlcActorAddress(): string {
    if (!this.provider.publicKey) throw new Error('No provider public key found');
    return this.provider.publicKey.toBase58();
  }

  /**
   * Determines if the given order is for a native Solana token (SOL).
   * @param {MatchedOrder} order - The matched order to check
   * @returns {boolean} True if it's a native token, false if it's an SPL token
   * @private
   */
  private isNativeToken(order: MatchedOrder): boolean {
    return isSolanaNativeToken(order.source_swap.chain, order.source_swap.token_address);
  }

  /**
   * Sends a transaction via the relayer for SPL tokens.
   * @param {web3.Transaction} transaction - The transaction to send
   * @param {string} orderId - The order ID for tracking
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   * @private
   */
  private async sendSplViaRelayer(
    transaction: web3.Transaction,
    orderId: string,
  ): AsyncResult<string, string> {
    try {
      transaction.recentBlockhash = (
        await this.provider.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.relayer;

      const signedTransaction = await this.provider.wallet.signTransaction(
        transaction,
      );

      const encodedTx = signedTransaction
        .serialize({ requireAllSignatures: false })
        .toString('base64');

      const res: APIResponse<string> = await Fetcher.post(
        this.url.endpoint('/initiate'),
        {
          body: JSON.stringify({
            order_id: orderId,
            serialized_tx: encodedTx,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.error || !res.result) {
        return Err(`Error from Relayer: ${res.error}`);
      }
 
      const isConfirmed = await waitForSolanaTxConfirmation(
        this.provider.connection,
        res.result,
      );
      return isConfirmed
        ? Ok(res.result)
        : Err('Relayer: Failed to Initiate swap, confirmation timed out');
    } catch (error) {
      return Err(
        `Failed to send SPL transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Initiates a swap directly via HTLC (without relayer).
   * @param {web3.Transaction} transaction - The transaction to send
   * @param {MatchedOrder} order - The matched order
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   * @private
   */
  private async initiateViaHTLC(
    transaction: web3.Transaction,
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    if (!order) return Err('Order is required');

    try {
      const txHash = await this.provider.sendAndConfirm(transaction);

      if (!txHash) return Err('Failed to initiate HTLC transaction');
 
      const isConfirmed = await waitForSolanaTxConfirmation(
        this.provider.connection,
        txHash,
      );

      return isConfirmed
        ? Ok(txHash)
        : Err('HTLC: Failed to Initiate swap, confirmation timed out');
    } catch (error) {
      return Err(
        `Error initiating swap: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Creates a PDA (Program Derived Address) for the swap account.
   * @param {Buffer} secretHash - The secret hash buffer
   * @param {web3.PublicKey} programId - The program ID to use for PDA derivation
   * @returns {web3.PublicKey} The derived PDA
   * @private
   */
  private createSwapPDA(secretHash: Buffer, programId: web3.PublicKey): web3.PublicKey {
    const pdaSeeds = [
      Buffer.from('swap_account'),
      this.provider.publicKey.toBuffer(),
      secretHash,
    ];

    return web3.PublicKey.findProgramAddressSync(pdaSeeds, programId)[0];
  }

  /**
   * Initiates a swap for SPL tokens.
   * @param {MatchedOrder} order - The matched order containing swap details
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   * @private
   */
  private async initiateSplSwap(order: MatchedOrder): AsyncResult<string, string> {
    try {
      const { redeemer, secretHash, amount, expiresIn } = SwapConfig.from(order);

      this.swapAccount = this.createSwapPDA(
        Buffer.from(secretHash),
        this.splProgram.programId
      );

      const txBuilder = this.splProgram.methods.initiate(
        expiresIn,
        redeemer,
        secretHash,
        amount,
        null,
      );

      const mint = new web3.PublicKey(order.source_swap.token_address);
      const accounts = {
        initiator: this.provider.publicKey,
        mint,
        initiatorTokenAccount: Spl.getAssociatedTokenAddressSync(
          mint,
          this.provider.publicKey
        ),
        sponsor: this.relayer,
      };

      const tx = await txBuilder.accounts(accounts).transaction();
      return this.sendSplViaRelayer(tx, order.create_order.create_id);
    } catch (error) {
      return Err(
        `Error initiating SPL swap: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Initiates a swap for native tokens (SOL).
   * @param {MatchedOrder} order - The matched order containing swap details
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   * @private
   */
  private async initiateNativeSwap(order: MatchedOrder): AsyncResult<string, string> {
    try {
      const { redeemer, secretHash, amount, expiresIn } = SwapConfig.from(order);

      this.swapAccount = this.createSwapPDA(
        Buffer.from(secretHash),
        this.nativeProgram.programId
      );

      const tx = await this.nativeProgram.methods
        .initiate(amount, expiresIn, redeemer, secretHash)
        .accounts({ initiator: this.provider.publicKey })
        .transaction();

      return this.initiateViaHTLC(tx, order);
    } catch (error) {
      return Err(
        `Error initiating native swap: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Initiates a swap by creating a new swap account and locking funds.
   * Automatically detects whether to use SPL or native token handling.
   * @param {MatchedOrder} order - The matched order containing swap details
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   */
  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    if (!order) {
      return Err('Order is required');
    }

    try {
      // Determine token type and route to appropriate handler
      const isNative = this.isNativeToken(order);
      
      if (isNative) {
        return await this.initiateNativeSwap(order);
      } else {
        return await this.initiateSplSwap(order);
      }
    } catch (error) {
      return Err(
        `Error initiating swap: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Redeems a swap by providing the secret.
   * @param {MatchedOrder} order - Matched order object containing swap details
   * @param {string} secret - Secret key in hex format
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   */
  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const _secret = validateSecret(secret);

      const relayRequest = {
        order_id: order.create_order.create_id,
        secret: Buffer.from(_secret).toString('hex'),
        // perform_on: 'destination',
      };

      const res: APIResponse<string> = await Fetcher.post(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify(relayRequest),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (res.error) {
        return Err(`Redeem: Error from relayer: ${res.error}`);
      }

      if (!res.result) {
        return Err('Redeem: No transaction hash returned from relayer');
      }

      const txHash = res.result;

      const isConfirmed = await waitForSolanaTxConfirmation(
        this.provider.connection,
        txHash,
      );

      return isConfirmed
        ? Ok(txHash)
        : Err('Redeem: Timed out waiting for confirmation');
    } catch (e) {
      console.error('Redeem: Caught exception:', e);
      return Err(
        `Error redeeming: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  /**
   * DO NOT CALL THIS FUNCTION. Refund is automatically taken care of by the relayer!
   * This method exists only to satisfy the ISolanaHTLC interface but is not intended for direct use.
   * @param order - Matched order object
   * @returns {AsyncResult<string, string>} Always returns an error message
   * @deprecated This function should never be called directly
   */
  async refund(): AsyncResult<string, string> {
    return Err('Refund is automatically handled by the relayer.');
  }
}