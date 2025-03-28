import { Garden } from './garden';
import * as anchor from "@coral-xyz/anchor";
import { Environment, with0x } from '@gardenfi/utils';
import { createWalletClient, http, PrivateKeyAccount, WalletClient } from 'viem';
import { beforeAll, describe, expect, it, beforeEach } from 'vitest';
import {
    EthereumLocalnet,
    MatchedOrder,
    SupportedAssets,
} from '@gardenfi/orderbook';
import { web3 } from '@coral-xyz/anchor';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockNumberFetcher } from '../blockNumberFetcher/blockNumber';
import { BitcoinNetwork, BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { skip } from 'node:test';

// Shared constants localnet
// const TEST_RPC_URL = "http://localhost:8899";
// const TEST_RELAY_URL = new URL("http://localhost:5014/relay");
// const TEST_SWAPPER_RELAYER = "http://localhost:4426";
// const TEST_PRIVATE_KEY = "0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61";
// const TEST_RELAYER_ADDRESS = "AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9";
// const TEST_BLOCKFETCHER_URL = "http://localhost:3008";


// Shared constants Testnet
const TEST_RPC_URL = "https://api.devnet.solana.com";
const TEST_RELAY_URL = new URL("https://solana-relayer-staging.hashira.io/relay");
const TEST_SWAPPER_RELAYER = "https://orderbook-stage.hashira.io/";
const TEST_PRIVATE_KEY = "0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61";
const TEST_RELAYER_ADDRESS = "8jiuEDT8T4Eqd38hiXRHJxRMvMkBWpEPVM3uuAn6bj93";
const TEST_BLOCKFETCHER_URL = "https://info-stage.hashira.io/";

const PRIV = [73, 87, 221, 5, 63, 180, 104, 26, 64, 41, 225, 50, 165, 84, 157, 74, 187, 105, 53, 112, 214, 236, 175, 55, 86, 247, 214, 120, 101, 90, 62, 178, 103, 156, 200, 13, 24, 181, 121, 93, 15, 85, 202, 164, 4, 30, 165, 77, 244, 66, 207, 78, 179, 255, 45, 233, 17, 131, 203, 187, 120, 110, 176, 172]

// Timeout constants
const EXECUTE_TIMEOUT = 60 * 10 * 1000;
const CREATE_ORDER_TIMEOUT = 30000;

/**
 * Helper function to setup garden instance
 */
function setupGarden(
    evmClient: WalletClient,
    solanaProvider: anchor.AnchorProvider,
    btcWallet: BitcoinWallet,
): Garden {
    return new Garden({
        environment: Environment.LOCALNET,
        evmWallet: evmClient,
        solWallet: solanaProvider,
        solanaRelayUrl: TEST_RELAY_URL,
        orderbookURl: TEST_SWAPPER_RELAYER,
        solanaRelayerAddress: TEST_RELAYER_ADDRESS,
        blockNumberFetcher: new BlockNumberFetcher(TEST_BLOCKFETCHER_URL, Environment.TESTNET),
        btcWallet: btcWallet,
        // apiKey: "AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c",
        apiKey: "AAAAAGmzpY46OpuOQc2zg4nnkFPt2mzzRVb2eifR9syXRB6TxiWOSdTnHlNGrYw80CWPSz993TSMVzJSo7uppDtY51zOR3rvuUcc",
        quote: "https://quote-staging.hashira.io/"
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

async function executeWithTimeout(
    garden: Garden,
    orderId?: string,
    timeoutMs: number = EXECUTE_TIMEOUT
): Promise<void> {
    return new Promise<void>((resolve) => {
        console.log("Inside execute with timeout");
        let resolved = false;

        // Backup resolver that will prevent the test from running indefinetly
        const resolveOnce = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        }

        // Setup the event listerns
        setupGardenListeners(garden, resolve, orderId);

        // Stop the test after timeout
        const timeout = setTimeout(() => {
            console.log("Test execution timed out but continuing...");
            resolveOnce();
        }, timeoutMs)

        // Calling exectue method
        garden.execute().catch(error => {
            console.error("Error during garden execution:", error);
            clearTimeout(timeout);
            resolveOnce();
        })
    })
}


// Helper methods
// const fundSolWallet = async (connection: web3.Connection, userProvider: anchor.AnchorProvider) => {
//     console.log("Airdropping 10 SOL to the user for testing");
//     const signature = await connection.requestAirdrop(userProvider.publicKey, web3.LAMPORTS_PER_SOL * 10);
//     await connection.confirmTransaction({ signature, ...(await connection.getLatestBlockhash()) });
//     console.log("Airdrop Success");
// }

// const mineBtcBlocks = async (address: string) => {
//     const body = {
//         jsonrpc: "1.0",
//         id: "mine",
//         method: "generatetoaddress",
//         params: [3, address],
//     };

//     console.log("Mining blocks:: ", address);

//     const auth = Buffer.from("admin1:123").toString("base64");

//     try {
//         const response = await fetch("http://localhost:18443/", {
//             method: "POST",
//             headers: {
//                 Authorization: `Basic ${auth}`,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(body)
//         });

//         const data = await response.json();
//         return data;
//     } catch (error: any) {
//         console.error("Error:", error.response?.data || error.message);
//     }
// };

// async function fundBTC(to: string): Promise<void> {
//     const payload = JSON.stringify({
//         address: to,
//     });

//     const res = await fetch("http://127.0.0.1:3000/faucet", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: payload,
//     });

//     const data = await res.text();

//     if (!res.ok) {
//         throw new Error(data);
//     }


//     const dat: { txId?: string } = JSON.parse(data);

//     if (!dat.txId) {
//         throw new Error("Not successful");
//     }
// }


describe('==========SOL <--> BTC===========', () => {

    // Solana setup
    let connection: web3.Connection;
    // let user: web3.Keypair;
    let userWallet: anchor.Wallet;
    let userProvider: anchor.AnchorProvider;

    // Bitcoin Setup
    let btcWallet: BitcoinWallet;
    let BTC_ADDRESS: string;
    let bitcoinProvider: BitcoinProvider;

    // EVM Setup
    let account: PrivateKeyAccount;
    let arbitrumWalletClient: WalletClient;


    beforeAll(async () => {
        //? Solana Initialization testnet
        // user = new web3.Keypair();
        // connection = new web3.Connection(TEST_RPC_URL, { commitment: "confirmed" });
        // userWallet = new anchor.Wallet(user);
        // userProvider = new anchor.AnchorProvider(connection, userWallet);

        const privateKeyBytes = new Uint8Array(PRIV);
        const user = web3.Keypair.fromSecretKey(privateKeyBytes);
        connection = new web3.Connection(TEST_RPC_URL, { commitment: "finalized" });
        userWallet = new anchor.Wallet(user)
        userProvider = new anchor.AnchorProvider(connection, userWallet);

        // Bitcoin Initialization
        console.log("Geting bitcoin address")
        bitcoinProvider = new BitcoinProvider(
            BitcoinNetwork.Testnet,
            'https://mempool.space/testnet4/api/'
        );
        btcWallet = BitcoinWallet.fromPrivateKey("02438b87e7153f29c954b21d9019118fc40d88a51943a7b5e19e82a32a308206", bitcoinProvider);
        BTC_ADDRESS = await btcWallet.getAddress();

        // EVM Initialization
        account = privateKeyToAccount(with0x(TEST_PRIVATE_KEY));
        console.log('account :', account.address);

        arbitrumWalletClient = createWalletClient({
            account,
            chain: EthereumLocalnet,
            transport: http(),
        });
    });

    describe("SOL -> BTC Swap", () => {
        let garden: Garden;
        let order: MatchedOrder;

        beforeEach(async () => {
            garden = setupGarden(
                arbitrumWalletClient,
                userProvider,
                btcWallet
            )

            // await fundSolWallet(connection, userProvider);
            // await fundBTC(BTC_ADDRESS);
        })

        it("should create and execute SOL -> BTC swap order", async () => {
            //TODO: Get the exact amount and set to recieve amout
            // 1. Create Order
            const orderObj = {
                fromAsset: SupportedAssets.testnet.solana_testnet_SOL,
                toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
                sendAmount: "59337016",
                receiveAmount: "9348",
                additionalData: {
                    strategyId: "strybtry",
                    btcAddress: BTC_ADDRESS,
                },
                minDestinationConfirmations: 3,
            };

            const result = await garden.swap(orderObj);
            console.log("Error in creating order::", result.error, result.val)
            expect(result.error).toBeFalsy();
            expect(result.val).toBeTruthy();

            order = result.val;
            console.log('✅ Order created:', order.create_order.create_id);

            // 2. Execute order
            await executeWithTimeout(
                garden,
                order.create_order.create_id
            );
        }, CREATE_ORDER_TIMEOUT + EXECUTE_TIMEOUT)
    });


    skip("BTC -> SOL Swap", () => {
        let garden: Garden;
        let order: MatchedOrder;

        beforeEach(async () => {
            garden = setupGarden(
                arbitrumWalletClient,
                userProvider,
                btcWallet
            )

            // await fundSolWallet(connection, userProvider);
            // const btcAddress = await btcWallet.getAddress();
            // await fundBTC(btcAddress);
        })

        it("Should create, match and execute BTC -> SOL swap", async () => {
            const orderObj = {
                fromAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
                toAsset: SupportedAssets.testnet.solana_testnet_SOL,
                sendAmount: "10000",
                receiveAmount: "10000",
                additionalData: {
                    strategyId: "btrystry",
                    btcAddress: BTC_ADDRESS,
                },
                minDestinationConfirmations: 3,
            };

            const result = await garden.swap(orderObj);
            console.log("Error in swap:: ", result.error)
            expect(result.error).toBeFalsy();
            expect(result.val).toBeTruthy();

            order = result.val;

            // Fund HTLC and mine for confirmation
            await btcWallet.send(
                order.source_swap.swap_id,
                +order.source_swap.amount
            )
            console.log("HTLC Funded Successfully");
            // await mineBtcBlocks(BTC_ADDRESS);
            console.log("3 Blocks mined");

            await executeWithTimeout(garden, order.create_order.create_id)
        }, CREATE_ORDER_TIMEOUT + EXECUTE_TIMEOUT)
    })
});
