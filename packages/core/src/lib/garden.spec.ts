import { JsonRpcProvider, Wallet } from "ethers";
import { Order, Orderbook, parseStatus } from "@gardenfi/orderbook";
import {
    BitcoinNetwork,
    BitcoinOTA,
    BitcoinProvider,
    EVMWallet,
    generateMnemonic,
    mnemonicToPrivateKey,
} from "@catalogfi/wallets";
import { GardenJS } from "./garden";
import { Assets } from "@gardenfi/orderbook";
import { CatalogErrors } from "./errors";

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const orderStatus = (order: Order) =>
    +`${order.status}${order.initiatorAtomicSwap.swapStatus}${order.followerAtomicSwap.swapStatus}`;

describe("Catalog", () => {
    const API_ENDPOINT = process.env["BACKEND_URL"];
    if (!API_ENDPOINT || !process.env["ANKR_RPC_URL"]) {
        throw new Error("Missing env vars");
    }
    const provider = new JsonRpcProvider(process.env["ANKR_RPC_URL"]);
    const pk = mnemonicToPrivateKey(generateMnemonic(), BitcoinNetwork.Testnet);
    const bitcoinPk = mnemonicToPrivateKey(
        generateMnemonic(),
        BitcoinNetwork.Testnet
    ); //add pks that are funded for the last test to pass

    const ethereumSigner = new Wallet(pk, provider);
    const bitcoinSigner = new Wallet(bitcoinPk, provider);
    const orderbook = new Orderbook({
        url: "https://" + API_ENDPOINT,
        signer: ethereumSigner,
    });
    const bitcoinProvider = new BitcoinProvider(BitcoinNetwork.Testnet);

    const sendAmount = 0.001 * 1e8;
    const receiveAmount = sendAmount - 0.003 * sendAmount;

    it("cannot swap if there's no from wallet", async () => {
        const catalog = new GardenJS(orderbook, {
            bitcoin_testnet: new BitcoinOTA(bitcoinProvider, ethereumSigner),
        });
        expect(
            async () =>
                await catalog.swap(
                    Assets.ethereum_sepolia.WBTC, //no evm wallet (from)
                    Assets.bitcoin_testnet.BTC,
                    sendAmount,
                    receiveAmount
                )
        ).rejects.toThrow(CatalogErrors.WALLET_NOT_FOUND(true));
    });

    it("cannot swap if there's no to wallet", async () => {
        const catalog = new GardenJS(orderbook, {
            bitcoin_testnet: new BitcoinOTA(bitcoinProvider, ethereumSigner),
        });
        expect(
            async () =>
                await catalog.swap(
                    Assets.bitcoin_testnet.BTC,
                    Assets.ethereum_sepolia.WBTC, // no evm wallet(to)
                    sendAmount,
                    receiveAmount
                )
        ).rejects.toThrow(CatalogErrors.WALLET_NOT_FOUND(false));
    });

    it("cannot swap if there's no bitcoin wallet", async () => {
        const catalog = new GardenJS(orderbook, {
            ethereum: new EVMWallet(ethereumSigner),
            ethereum_sepolia: new EVMWallet(ethereumSigner),
        });

        expect(async () => {
            await catalog.swap(
                Assets.ethereum_sepolia.WBTC,
                Assets.ethereum_sepolia.WBTC,
                sendAmount,
                receiveAmount
            );
        }).rejects.toThrow(CatalogErrors.CHAIN_WALLET_NOT_FOUND("EVM"));
    });

    it("should create an order with valid parameters", async () => {
        const catalog = new GardenJS(orderbook, {
            ethereum_sepolia: new EVMWallet(ethereumSigner),
            bitcoin_testnet: new BitcoinOTA(bitcoinProvider, ethereumSigner),
        });

        const order = await catalog.swap(
            Assets.ethereum_sepolia.WBTC,
            Assets.bitcoin_testnet.BTC,
            sendAmount,
            receiveAmount
        );

        expect(order).toBeTruthy();
    });

    it.skip(
        "should initiate and redeem",
        async () => {
            const bitcoinWallet = new BitcoinOTA(
                bitcoinProvider,
                bitcoinSigner
            );
            const evmWallet = new EVMWallet(ethereumSigner);
            const catalog = new GardenJS(orderbook, {
                ethereum_sepolia: evmWallet,
                bitcoin_testnet: bitcoinWallet,
            });

            const orderId = await catalog.swap(
                Assets.bitcoin_testnet.BTC,
                Assets.ethereum_sepolia.WBTC,
                sendAmount,
                receiveAmount
            );

            expect(orderId).toBeTruthy();

            let statusChanged = false;
            let status = 0;

            catalog.subscribeOrders(
                await ethereumSigner.getAddress(),
                async (orders) => {
                    const currentOrder = orders.filter(
                        (order) => order.ID === orderId
                    )[0];
                    if (!currentOrder) return;

                    try {
                        if (currentOrder) {
                            const currentStatus = orderStatus(currentOrder);
                            if (currentStatus === status) {
                                return;
                            }
                            if (
                                currentStatus === 200 ||
                                currentStatus === 222
                            ) {
                                await catalog.getSwap(currentOrder).next();
                                statusChanged = true;
                                status = currentStatus;
                            }
                        }
                    } catch (err) {
                        throw new Error((err as Error).message);
                    }
                }
            );

            const expectedStatuses = [200, 222];

            for (let i = 0; i < expectedStatuses.length; i++) {
                while (!statusChanged)
                    await new Promise((resolve) => setTimeout(resolve, 500));
                statusChanged = false;
                expect(status).toEqual(expectedStatuses[i]);
            }

            catalog.unsubscribeOrders();
        },
        1000 * 1000
    );
});
