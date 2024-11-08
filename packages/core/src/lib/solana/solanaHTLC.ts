import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import { IHTLCWallet } from "@catalogfi/wallets";
import idl from "./idl/solana_native_swaps.json";
import { SolanaNativeSwaps } from "./idl/solana_native_swaps";
import { SwapConfig, validateSecret } from "./solanaTypes";

/**
 * SolanaHTLC is an implementation of IHTLCWallet that performs atomic swaps directly on-chain.
 * As such, fees will be deducted from the initiator.
 * To use a relayer that pays fees on behalf, see SolanaRelay
 */
export class SolanaHTLC implements IHTLCWallet {
    /**
     * The on-chain Program Derived Address (PDA) that facilitates this swap.
     * Stores the swap state (initiator, redeemer, secrethash etc) and escrows the tokens.
     */
    private swapAccount: web3.PublicKey;
    private program: Program<SolanaNativeSwaps>;

    /**
     * @constructor
     * @param swapConfig Config for the swap.
     * @param provider Solana Provider (abstraction of RPC connection and a Wallet)
     */
    constructor(
        private swap: SwapConfig,
        private provider: AnchorProvider,
    ) {
        this.program = new Program(idl as SolanaNativeSwaps, provider);
        const pdaSeeds = [Buffer.from("swap_account"), Buffer.from(swap.swapId)];
        this.swapAccount = web3.PublicKey.findProgramAddressSync(pdaSeeds, this.program.programId)[0];
    }

    /**
     * The on-chain address of the atomic swap program
     * @returns {string} The program's on-chain address (base58)
     */
    id(): string {
        return this.program.programId.toBase58();
    }

    /**
     * Initiates the swap, paying the fees
     * @returns {Promise<string>} Transaction ID
     */
    async init(): Promise<string> {
        const { swapId, redeemer, secretHash, amount, expiresIn } = this.swap;
        const tx = await this.program.methods
            .initiate(swapId, redeemer, secretHash, amount, expiresIn)
            .accounts({ initiator: this.provider.publicKey })
            .transaction();
        return await this.provider.sendAndConfirm(tx);
    }

    /**
     * Redeem the swap
     * @param secret - A 32 byte hex encoded string
     * @returns {string} Transaction ID
     */
    async redeem(secret: string): Promise<string> {
        const tx = await this.program.methods
            .redeem(validateSecret(secret))
            .accounts({
                swapAccount: this.swapAccount,
                redeemer: this.swap.redeemer,
            })
            .transaction();
        return await this.provider.sendAndConfirm(tx);
    }

    /**
     * Refunds the swap
     * @returns {string} Transaction ID
     */
    async refund(): Promise<string> {
        const tx = await this.program.methods
            .refund()
            .accounts({
                swapAccount: this.swapAccount,
                refundee: this.provider.publicKey,
            })
            .transaction();
        return await this.provider.sendAndConfirm(tx);
    }
}