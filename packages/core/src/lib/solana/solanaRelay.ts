import { web3, AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "./idl/solana_native_swaps.json";
import { SolanaNativeSwaps } from "./idl/solana_native_swaps";
import { SwapConfig, validateSecret } from "./solanaTypes";
import { Fetcher } from "@catalogfi/utils";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { APIResponse } from "@gardenfi/utils";
import { URL } from "url";

/**
 * A Relay is an endpoint that submits the transaction on-chain on one's behalf, paying any fees.
 * SolanaRelay is one such implementation performs the atomic swaps through a given relayer url.
 */
export class SolanaRelay {
    /**
     * The on-chain Program Derived Address (PDA) that facilitates this swap.
     * A PDA represents an on-chain memory space. It can store SOL too and is owned by a program (that derived it).
     * This PDA stores the swap state (initiator, redeemer, secrethash etc) on-chain and also escrows the SOL.
     */
    private swapAccount: web3.PublicKey;
    private program: Program<SolanaNativeSwaps>;
    private relayer: web3.PublicKey;
    /**
     * @constructor
     * @param swap - Configuration for the Atomic swap
     * @param provider - An abstraction of RPC connection and a Wallet
     * @param endpoint - API endpoint of the relayer node
     * @param relayer - On-chain address of the relayer in base58
     */
    constructor(
        private swap: SwapConfig,
        private provider: AnchorProvider,
        private endpoint: URL,
        relayer: string,
    ) {
        this.provider = provider;
        this.program = new Program(idl as SolanaNativeSwaps, provider);
        try {
            this.relayer = new web3.PublicKey(relayer);
        } catch (cause) {
            throw new Error("Error decoding relayer publickey. Ensure it is a base58 encoded string", { cause });
        }
        const pdaSeeds = [Buffer.from("swap_account"), Buffer.from(this.swap.swapId)];
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
     * Initiate the swap
     * @returns {Promise<string>} Transaction ID
     */
    async init(): Promise<string> {
        const { swapId, redeemer, secretHash, amount, expiresIn } = this.swap;
        const tx = await this.program.methods
            .initiate(swapId, redeemer, secretHash, amount, expiresIn)
            .accounts({ initiator: this.provider.publicKey })
            .transaction();
        tx.recentBlockhash = (await this.provider.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = this.relayer;
        await this.provider.wallet.signTransaction(tx);
        const encodedTx = bs58.encode(tx.serialize({ requireAllSignatures: false }));

        const res: APIResponse<string> = await Fetcher.post(this.endpoint, {
            body: encodedTx,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
        if (res.error) {
            throw new Error("Error from Relayer when trying to init:" + res.error);
        }
        return res.result!;
    }

    /**
     * Redeem the swap
     * @param secret - Hex encoded string
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
        tx.recentBlockhash = (await this.provider.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = this.relayer;
        const encodedTx = bs58.encode(tx.serialize({ requireAllSignatures: false }));
        const res: APIResponse<string> = await Fetcher.post(this.endpoint, {
            body: encodedTx,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
        if (res.error)
            throw new Error("Error from Relayer when trying to redeem:" + res.error);
        return res.result!;
    }
}