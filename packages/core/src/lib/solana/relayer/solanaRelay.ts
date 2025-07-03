import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../idl/solana_native_swaps.json";
import { SolanaNativeSwaps } from "../idl/solana_native_swaps";
import { SwapConfig, validateSecret } from "../solanaTypes";
import { AsyncResult, Err, Fetcher, Ok } from "@catalogfi/utils";
import { APIResponse, Url } from "@gardenfi/utils";
import { ISolanaHTLC } from "../htlc/ISolanaHTLC";
import { isSolanaNativeToken, MatchedOrder } from "@gardenfi/orderbook";

/**
 * A Relay is an endpoint that submits the transaction on-chain on one's behalf, paying any fees.
 * SolanaRelay is one such implementation performs the atomic swaps through a given relayer url.
 */
export class SolanaRelay implements ISolanaHTLC {
  /**
   * The on-chain Program Derived Address (PDA) that facilitates this swap.
   * A PDA represents an on-chain memory space. It can store SOL too and is owned by a program (that derived it).
   * This PDA stores the swap state (initiator, redeemer, secrethash etc) on-chain and also escrows the SOL.
   */
  private swapAccount?: web3.PublicKey;
  private program: Program<SolanaNativeSwaps>;
  private relayer: web3.PublicKey;

  /**
   * Creates a new instance of SolanaRelay.
   * @param {AnchorProvider} provider - An abstraction of RPC connection and a Wallet
   * @param {Url} endpoint - API endpoint of the relayer node
   * @param {string} relayer - On-chain address of the relayer in base58 format
   * @throws {Error} If any required parameters are missing or invalid
   */
  constructor(
    private provider: AnchorProvider,
    private url: Url,
    relayer: string,
  ) {
    if (!provider) throw new Error("Provider is required");
    if (!url) throw new Error("Endpoint URL is required");
    if (!relayer) throw new Error("Relayer address is required");

    this.provider = provider;
    this.program = new Program(idl as SolanaNativeSwaps, provider);
    try {
      this.relayer = new web3.PublicKey(relayer);
    } catch (cause) {
      throw new Error(
        "Error decoding relayer publickey. Ensure it is a base58 encoded string",
        { cause },
      );
    }
  }

  /**
   * Gets the on-chain address of the atomic swap program.
   * @returns {string} The program's on-chain address in base58 format
   * @throws {Error} If no program ID is found
   */
  get htlcActorAddress(): string {
    if (!this.program.programId) throw new Error("No program found");
    return this.provider.publicKey.toBase58();
  }

  /**
   * Sends a transaction via the relayer.
   * @param {web3.Transaction} transaction - The transaction to send
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   * @private
   */
  private async sendViaRelayer(
    transaction: web3.Transaction,
    orderId: string,
  ): AsyncResult<string, string> {
    try {
      transaction.recentBlockhash = (
        await this.provider.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.relayer;

      const signedTransaction =
        await this.provider.wallet.signTransaction(transaction);

      // Use the signed transaction (with compute budget instructions) for encoding
      const encodedTx = signedTransaction
        .serialize({ requireAllSignatures: false })
        .toString("base64");

      const relayRequest = {
        order_id: orderId,
        serialized_tx: encodedTx,
        perform_on: "source",
      };

      // Send to relayer
      const res: APIResponse<string> = await Fetcher.post(
        this.url.endpoint("/spl-initiate"),
        {
          body: JSON.stringify(relayRequest),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.error) {
        return Err(`Error from Relayer: ${res.error}`);
      }

      return res.result
        ? Ok(res.result)
        : Err("No result returned from relayer");
    } catch (error) {
      console.error("Error in sendViaRelayer:", error);
      return Err(
        `Failed to send transaction: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async initiateViaHTLC(
    transaction: web3.Transaction,
    order: MatchedOrder,
  ): AsyncResult<string, string> {
    if (!order) return Err("Order is required");

    try {
      const txHex = await this.provider.sendAndConfirm(transaction);

      return txHex ? Ok(txHex) : Err("Failed to initiate HTLC transaction");
    } catch (error) {
      return Err(
        `Error initiating swap: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Initiates a swap by creating a new swap account and locking funds.
   * @param {MatchedOrder} order - The matched order containing swap details
   * @returns {Promise<AsyncResult<string, string>>} A promise that resolves to either:
   *   - Ok with the transaction ID on success
   *   - Err with an error message on failure
   */
  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    const { redeemer, secretHash, amount, expiresIn } = SwapConfig.from(order);

    const pdaSeeds = [
      Buffer.from("swap_account"),
      this.provider.publicKey.toBuffer(),
      Buffer.from(secretHash),
    ];

    this.swapAccount = web3.PublicKey.findProgramAddressSync(
      pdaSeeds,
      this.program.programId,
    )[0];

    try {
      const tx = await this.program.methods
        .initiate(amount, expiresIn, redeemer, secretHash)
        .accounts({ initiator: this.provider.publicKey })
        .transaction();

      if (
        !isSolanaNativeToken(order.source_swap.chain, order.source_swap.asset)
      )
        return this.sendViaRelayer(tx, order.create_order.create_id);
      else return this.initiateViaHTLC(tx, order);
    } catch (e) {
      return Err("Error initiating swap: ", e);
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
    const { secretHash } = SwapConfig.from(order);
    const pdaSeeds = [
      Buffer.from("swap_account"),
      this.provider.publicKey.toBuffer(),
      Buffer.from(secretHash),
    ];

    this.swapAccount = web3.PublicKey.findProgramAddressSync(
      pdaSeeds,
      this.program.programId,
    )[0];

    try {
      const _secret = validateSecret(secret);

      const relayRequest = {
        order_id: order.create_order.create_id,
        secret: Buffer.from(_secret).toString("hex"),
        perform_on: "destination",
      };

      const res: APIResponse<string> = await Fetcher.post(
        this.url.endpoint("redeem"),
        {
          body: JSON.stringify(relayRequest),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (res.error) {
        return Err(`Error from Relayer: ${res.error}`);
      }
      return res.result ? Ok(res.result) : Err("Redeem: No result found");
    } catch (e) {
      return Err("Error redeeming: ", e);
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
    return Err("Refund is automatically handled by the relayer.");
  }
}
