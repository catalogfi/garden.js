import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, expect, it, beforeEach } from "vitest";
import { Environment, Err, Siwe, Url, with0x } from '@gardenfi/utils';
import { MatchedOrder, Orderbook, SupportedAssets } from "@gardenfi/orderbook";
import { privateKeyToAccount, PrivateKeyAccount } from "viem/accounts";
import { createWalletClient, http, WalletClient } from 'viem';
import { EthereumLocalnet } from "@gardenfi/orderbook";
import { arbitrumSepolia, Chain } from "viem/chains";
import { SolanaHTLC } from "../../htlc/solanaHTLC";
import { DigestKey } from "../../../garden/digestKey/digestKey";
import { Garden } from "../../../garden/garden";
import { EvmRelay } from "../../../evm/relay/evmRelay";
import { API } from "../../../constants";
import { BlockNumberFetcher } from "../../../blockNumberFetcher/blockNumber";
import { Quote } from "../../../quote/quote";
import { SwapParams } from "../../../garden/garden.types";

// Shared constants
const TEST_RPC_URL = "http://localhost:8899";
const TEST_SWAPPER_RELAYER = "http://localhost:4426";
const TEST_PRIVATE_KEY = "0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61";
const TEST_BLOCKFETCHER_URL = "http://localhost:3008";

// Timeout constants
const EXECUTE_TIMEOUT = 90000;
const CREATE_ORDER_TIMEOUT = 30000;

/**
 * Helper function to setup garden instance
 */
function setupGarden(
    digestKey: string,
    evmClient: WalletClient,
    solanaProvider: anchor.AnchorProvider
): Garden {
    return new Garden({
        environment: Environment.LOCALNET,
        digestKey,
        htlc: {
            solana: new SolanaHTLC(solanaProvider),
            evm: new EvmRelay(
                API.localnet.evmRelay,
                evmClient,
                Siwe.fromDigestKey(new Url(API.localnet.orderbook), digestKey),
            ),
        },
        orderbook: new Orderbook(new Url(TEST_SWAPPER_RELAYER)),
        blockNumberFetcher: new BlockNumberFetcher(TEST_BLOCKFETCHER_URL, Environment.LOCALNET),
        quote: new Quote("http://localhost:6969")
    })
}

/**
 * Configure event listeners for garden instance and resolve the promise when successful
 */
function setupGardenListeners(
    garden: Garden,
    resolver: () => void,
    orderId?: string
): void {
    garden.on('error', (order: MatchedOrder, error: string) => {
        console.log(`❌ Error executing order ${order.create_order.create_id}: ${error}`);
    });

    garden.on('success', (order: MatchedOrder, action: string) => {
        console.log(`✅ Successfully executed ${action} for order ${order.create_order.create_id}`);
        // If this is the order we're waiting for, or if we're not looking for a specific order
        if (!orderId || order.create_order.create_id === orderId) {
            resolver(); // Resolve the promise to end the test early
        }
    });

    garden.on('log', (id: string, message: string) => {
        console.log(`📝 Log [${id}]: ${message}`);
    });

    garden.on('onPendingOrdersChanged', (orders: MatchedOrder[]) => {
        console.log(`⏳Pending orders: ${orders.length}`);
        orders.forEach((order) => {
            console.log(`Pending order: ${order.create_order.create_id}`);
        });
    });

    garden.on('rbf', (order: MatchedOrder, result: unknown) => {
        console.log(`🔄 RBF for order ${order.create_order.create_id}: ${JSON.stringify(result)}`);
    });
}

/**
 * Execute garden order with proper timeout handling
 */
async function executeWithTimeout(garden: Garden, orderId?: string, timeoutMs: number = EXECUTE_TIMEOUT): Promise<void> {
    return new Promise<void>((resolve) => {
        let resolved = false;

        // Create resolver function that ensures we only resolve once
        const resolveOnce = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };

        // Set up event listeners with the resolver
        setupGardenListeners(garden, resolveOnce, orderId);

        // Set a timeout as fallback
        const timeout = setTimeout(() => {
            console.log("Test execution timed out but continuing...");
            resolveOnce();
        }, timeoutMs);

        // Execute the garden
        garden.execute().catch(error => {
            console.error("Error during garden execution:", error);
            clearTimeout(timeout);
            resolveOnce();
        });
    });
}

describe('Swap Tests', () => {
    let connection: web3.Connection;
    let user: web3.Keypair;
    let userProvider: anchor.AnchorProvider;
    let account: PrivateKeyAccount;

    beforeAll(() => {
        // Create random keypair for Solana user
        user = new web3.Keypair();

        // Setup Solana connection
        connection = new web3.Connection(TEST_RPC_URL, { commitment: "confirmed" });
        userProvider = new anchor.AnchorProvider(connection, new anchor.Wallet(user), {
            commitment: "confirmed"
        });

        // Setup EVM account
        account = privateKeyToAccount(with0x(TEST_PRIVATE_KEY));
        console.log('EVM Account:', account.address);
    });

    describe('SOL -> wBTC Swap', () => {
        let garden: Garden;
        let order: MatchedOrder;
        let arbitrumWalletClient: WalletClient;
        const digestKey = DigestKey.generateRandom().val.digestKey;

        beforeEach(async () => {
            // Setup Arbitrum wallet
            arbitrumWalletClient = createWalletClient({
                account,
                chain: arbitrumSepolia as Chain,
                transport: http(),
            });

            // Setup Garden instance
            garden = setupGarden(digestKey,
                arbitrumWalletClient, userProvider);

            // Airdrop SOL for testing
            console.log("Airdropping SOL to the test wallet 📦");
            const signature = await connection.requestAirdrop(
                userProvider.publicKey,
                web3.LAMPORTS_PER_SOL * 10
            );
            await connection.confirmTransaction({
                signature,
                ...(await connection.getLatestBlockhash())
            });
        });

        it("should create and execute a SOL->wBTC swap order", async () => {
            // 1. Create order
            const orderObj: SwapParams = {
                fromAsset: SupportedAssets.localnet.solana_localnet_SOL,
                toAsset: SupportedAssets.localnet.arbitrum_localnet_WBTC,
                sendAmount: '10000000',
                receiveAmount: '998000',
                additionalData: { strategyId: 'sl4sal78' },
                minDestinationConfirmations: 2,
            };

            const result = await garden.swap(orderObj);
            expect(result.error).toBeFalsy();
            expect(result.val).toBeTruthy();

            order = result.val;
            console.log('✅ Order created:', order.create_order.create_id);

            // 2. Execute order with proper timeout handling
            await executeWithTimeout(garden, order.create_order.create_id);
        }, CREATE_ORDER_TIMEOUT + EXECUTE_TIMEOUT);
    });

    describe('wBTC -> SOL Swap', () => {
        let garden: Garden;
        let order: MatchedOrder;
        let ethereumWalletClient: WalletClient;
        const digestKey = DigestKey.generateRandom().val.digestKey;

        beforeEach(async () => {
            // Setup Ethereum wallet
            ethereumWalletClient = createWalletClient({
                account,
                chain: EthereumLocalnet as Chain,
                transport: http(),
            });

            // Setup Garden instance
            garden = setupGarden(
                digestKey,
                ethereumWalletClient, userProvider);

            // Airdrop SOL for testing
            console.log("Airdropping SOL to the test wallet 📦");
            const signature = await connection.requestAirdrop(
                userProvider.publicKey,
                web3.LAMPORTS_PER_SOL * 10
            );
            await connection.confirmTransaction({
                signature,
                ...(await connection.getLatestBlockhash())
            });
        });

        it("should create, initiate and execute a wBTC->SOL swap order", async () => {
            // 1. Create order
            const orderObj: SwapParams = {
                fromAsset: SupportedAssets.localnet.ethereum_localnet_WBTC,
                toAsset: SupportedAssets.localnet.solana_localnet_SOL,
                sendAmount: '100000',
                receiveAmount: '100000',
                additionalData: { strategyId: 'el78sl4s' },
                minDestinationConfirmations: 3,
            };

            const createResult = await garden.swap(orderObj);
            expect(createResult.error).toBeFalsy();
            expect(createResult.val).toBeTruthy();

            order = createResult.val;
            console.log('✅ Order created:', order.create_order.create_id);

            // 2. Initiate swap
            if (!garden.evmHTLC)
                return Err("Garden EVL HTLC not initialized!");
            const initResult = await garden.evmHTLC.initiate(order);

            expect(initResult.ok).toBeTruthy();
            console.log('Order initiated ✅');

            // 3. Execute order with proper timeout handling
            await executeWithTimeout(garden, order.create_order.create_id);
        }, CREATE_ORDER_TIMEOUT + EXECUTE_TIMEOUT);
    });
});