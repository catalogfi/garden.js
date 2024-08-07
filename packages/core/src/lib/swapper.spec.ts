import {
    BitcoinNetwork,
    BitcoinOTA,
    BitcoinProvider,
    BitcoinWallet,
    EVMHTLCErrors,
    EVMWallet,
    generateMnemonic,
    mnemonicToPrivateKey,
} from '@catalogfi/wallets';
import { JsonRpcProvider, Wallet, sha256 } from 'ethers';
import { Swapper } from './swapper';
import {
    atomicSwapStatus,
    fund,
    mineBtcBlocks,
    mineEvmBlocks,
    orderFactory,
} from './testUtils';
import { trim0x, with0x } from '@catalogfi/utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { xOnlyPubkey } from './utils';
import { Order } from '@gardenfi/orderbook';
import { htlcErrors } from './errors';

describe('Swapper', async () => {
    const evmProvider = new JsonRpcProvider('http://localhost:8545');

    const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

    const bitcoinProvider = new BitcoinProvider(
        BitcoinNetwork.Regtest,
        'http://localhost:30000'
    );

    const aliceMnemonic = generateMnemonic();
    const bobMnemonic = generateMnemonic();

    const alicePk = mnemonicToPrivateKey(aliceMnemonic, BitcoinNetwork.Regtest);
    const bobPk = mnemonicToPrivateKey(bobMnemonic, BitcoinNetwork.Regtest);

    const aliceEvmWallet = new Wallet(alicePk, evmProvider);
    const bobEvmWallet = new Wallet(bobPk, evmProvider);

    const aliceBtcWallet = new BitcoinOTA(bitcoinProvider, aliceEvmWallet);
    const bobBtcWallet = BitcoinWallet.fromMnemonic(
        bobMnemonic,
        bitcoinProvider
    );

    const aliceBtcAddress = await aliceBtcWallet.getAddress();
    const bobBtcAddress = await bobBtcWallet.getAddress();
    const aliceEvmAddress = await aliceEvmWallet.getAddress();
    const bobEvmAddress = await bobEvmWallet.getAddress();

    it('should not perform actions on invalid status', async () => {
        const secretNonce = Date.now();
        const msg = sha256(
            with0x(
                Buffer.from(
                    'catalog.js' + secretNonce + aliceEvmAddress
                ).toString('hex')
            )
        ).slice(2);
        const signedMessage = await aliceBtcWallet.sign(msg);
        const secret = trim0x(sha256(with0x(signedMessage)));
        const secretHash = sha256(with0x(secret));

        const order = orderFactory({
            secret,
            secretHash,
            secretNonce,
            userBtcWalletAddress: aliceBtcAddress,
            initiatorInitatorAddress: aliceBtcAddress,
            initiatorRedeemerAddress: bobBtcAddress,
            followerInitiatorAddress: bobEvmAddress,
            followerRedeemerAddress: aliceEvmAddress,
            fromBitcoin: true,
            contractAddress,
        });

        const swapper = new Swapper(order, {
            bitcoin_regtest: aliceBtcWallet,
            ethereum_localnet: new EVMWallet(aliceEvmWallet),
        });

        let invalidCounter = 0;
        const invalidStatuses = ['221', '244', '452', '561'];

        for (const invalidStatus of invalidStatuses) {
            order.status = Number(invalidStatus[0]);
            order.initiatorAtomicSwap.swapStatus = Number(invalidStatus[1]);
            order.followerAtomicSwap.swapStatus = Number(invalidStatus[2]);
            const swapOutput = await swapper.next();
            if (swapOutput.output.length === 0) invalidCounter++;
        }

        expect(invalidCounter).toBe(invalidStatuses.length);
    });

    it(
        'should be able to initiate and redeem (btc to wbtc)',
        async () => {
            const secretNonce = Date.now();
            await fund(aliceBtcAddress);

            const msg = trim0x(
                sha256(
                    with0x(
                        Buffer.from(
                            'catalog.js' + secretNonce + aliceEvmAddress
                        ).toString('hex')
                    )
                )
            );
            const signedMessage = await aliceBtcWallet.sign(msg);
            const secret = trim0x(sha256(with0x(signedMessage)));
            const secretHash = sha256(with0x(secret));

            await fund(bobEvmAddress);
            await fund(aliceEvmAddress);

            const order = orderFactory({
                secret,
                secretHash,
                secretNonce,
                userBtcWalletAddress: aliceBtcAddress,
                initiatorInitatorAddress: xOnlyPubkey(
                    await aliceBtcWallet.getPublicKey()
                ).toString('hex'),
                initiatorRedeemerAddress: xOnlyPubkey(
                    await bobBtcWallet.getPublicKey()
                ).toString('hex'),
                followerInitiatorAddress: bobEvmAddress,
                followerRedeemerAddress: aliceEvmAddress,
                fromBitcoin: true,
                contractAddress,
            });

            const aliceSwapper = new Swapper(order, {
                bitcoin_regtest: aliceBtcWallet,
                ethereum_localnet: new EVMWallet(aliceEvmWallet),
            });

            const bobSwapper = new Swapper(order, {
                ethereum_localnet: new EVMWallet(bobEvmWallet),
                bitcoin_regtest: bobBtcWallet,
            });

            order.status = 2;
            await aliceSwapper.next(); //alice init

            order.initiatorAtomicSwap.swapStatus = 2;

            await bobSwapper.next(); //bob init

            await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

            const { initiator } = await atomicSwapStatus(
                order.secretHash,
                bobEvmWallet,
                contractAddress
            );

            expect(initiator).toEqual(bobEvmAddress);

            order.followerAtomicSwap.swapStatus = 2;
            await aliceSwapper.next(); //alice redeem
            order.followerAtomicSwap.swapStatus = 4;
            await bobSwapper.next(); //bob redeem

            await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

            const { fulfilled } = await atomicSwapStatus(
                order.secretHash,
                bobEvmWallet,
                contractAddress
            );

            expect(fulfilled).toBeTruthy();
        },
        120 * 1000
    );

    it(
        'should be able to initiate and redeem (wbtc to btc)',
        async () => {
            const secretNonce = Date.now();
            await fund(bobBtcAddress);
            const msg = trim0x(
                sha256(
                    with0x(
                        Buffer.from(
                            'catalog.js' + secretNonce + aliceEvmAddress
                        ).toString('hex')
                    )
                )
            );
            const signedMessage = await aliceBtcWallet.sign(msg);
            const secret = trim0x(sha256(with0x(signedMessage)));
            const secretHash = sha256(with0x(secret));

            const order = orderFactory({
                secret,
                secretHash,
                secretNonce,
                userBtcWalletAddress: aliceBtcAddress,
                initiatorInitatorAddress: aliceEvmAddress,
                initiatorRedeemerAddress: bobEvmAddress,
                followerInitiatorAddress: xOnlyPubkey(
                    await bobBtcWallet.getPublicKey()
                ).toString('hex'),
                followerRedeemerAddress: xOnlyPubkey(
                    await aliceBtcWallet.getPublicKey()
                ).toString('hex'),
                fromBitcoin: false,
                contractAddress,
            });

            await fund(aliceEvmAddress);
            await fund(bobEvmAddress);

            const aliceSwapper = new Swapper(order, {
                bitcoin_regtest: aliceBtcWallet,
                ethereum_localnet: new EVMWallet(aliceEvmWallet),
            });

            const bobSwapper = new Swapper(order, {
                ethereum_localnet: new EVMWallet(bobEvmWallet),
                bitcoin_regtest: bobBtcWallet,
            });

            order.status = 2;
            await aliceSwapper.next(); //alice init
            order.initiatorAtomicSwap.swapStatus = 2;
            await bobSwapper.next(); //bob init

            await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

            const { initiator } = await atomicSwapStatus(
                order.secretHash,
                aliceEvmWallet,
                contractAddress
            );

            expect(initiator).toEqual(aliceEvmAddress);

            order.followerAtomicSwap.swapStatus = 2;
            await aliceSwapper.next();
            order.followerAtomicSwap.swapStatus = 4;
            await bobSwapper.next();

            await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

            const { fulfilled } = await atomicSwapStatus(
                order.secretHash,
                aliceEvmWallet,
                contractAddress
            );

            expect(fulfilled).toBeTruthy();
        },
        120 * 1000
    );

    describe('refunds', () => {
        let aliceSwapper: Swapper;
        let bobSwapper: Swapper;
        let order: Order;
        let initialBtcBalance: number;
        beforeEach(async () => {
            //init
            const secretNonce = Date.now();
            await fund(bobBtcAddress);
            initialBtcBalance = await aliceBtcWallet.getBalance();

            const msg = trim0x(
                sha256(
                    with0x(
                        Buffer.from('catalog.js' + secretNonce).toString('hex')
                    )
                )
            );
            const signedMessage = await aliceBtcWallet.sign(msg);
            const secret = trim0x(sha256(with0x(signedMessage)));
            const secretHash = sha256(with0x(secret));

            order = orderFactory({
                secret,
                secretHash,
                secretNonce,
                userBtcWalletAddress: aliceBtcAddress,
                initiatorInitatorAddress: aliceEvmAddress,
                initiatorRedeemerAddress: bobEvmAddress,
                followerInitiatorAddress: xOnlyPubkey(
                    await bobBtcWallet.getPublicKey()
                ).toString('hex'),
                followerRedeemerAddress: xOnlyPubkey(
                    await aliceBtcWallet.getPublicKey()
                ).toString('hex'),
                fromBitcoin: false,
                contractAddress,
            });

            await fund(aliceEvmAddress);

            await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

            aliceSwapper = new Swapper(order, {
                bitcoin_regtest: aliceBtcWallet,
                ethereum_localnet: new EVMWallet(aliceEvmWallet),
            });

            bobSwapper = new Swapper(order, {
                ethereum_localnet: new EVMWallet(bobEvmWallet),
                bitcoin_regtest: bobBtcWallet,
            });

            order.status = 2;
            await aliceSwapper.next(); //alice init
            order.initiatorAtomicSwap.swapStatus = 2;
            await bobSwapper.next(); //bob init

            await new Promise((resolve) => setTimeout(resolve, 20 * 1000));
        }, 120 * 1000);

        it(
            'should not happen before expiry',
            async () => {
                order!.initiatorAtomicSwap.swapStatus = 3;
                await expect(aliceSwapper!.next()).rejects.toThrow(
                    EVMHTLCErrors.ORDER_NOT_EXPIRED
                );
                order!.initiatorAtomicSwap.swapStatus = 2;
                order!.followerAtomicSwap.swapStatus = 3;

                await expect(bobSwapper!.next()).rejects.toThrow(
                    htlcErrors.htlcNotExpired(3)
                );
            },
            30 * 1000
        );

        it(
            'should happen after expiry',
            async () => {
                await mineEvmBlocks(evmProvider, 5);

                order!.initiatorAtomicSwap.swapStatus = 3;
                await aliceSwapper!.next();

                const { fulfilled } = await atomicSwapStatus(
                    order!.secretHash,
                    aliceEvmWallet,
                    contractAddress
                );
                expect(fulfilled).toBeTruthy();

                order!.initiatorAtomicSwap.swapStatus = 2;
                order!.followerAtomicSwap.swapStatus = 3;

                await mineBtcBlocks(
                    5,
                    await BitcoinWallet.createRandom(
                        bitcoinProvider
                    ).getAddress()
                );
                await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

                const { output: tx } = await bobSwapper!.next();
                expect(tx.length).toBeGreaterThan(1);
                const finalBtcBalance = await aliceBtcWallet.getBalance();
                expect(initialBtcBalance - finalBtcBalance).toBeLessThan(2000);
            },
            30 * 1000
        );
    });
});
