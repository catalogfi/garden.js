import {
  BitcoinHTLCErrors,
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

describe('Swapper', () => {
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
  const bobBtcWallet = BitcoinWallet.fromMnemonic(bobMnemonic, bitcoinProvider);

  it('should not perform actions on invalid status', async () => {
    const secretNonce = Date.now();
    const msg = sha256(
      with0x(
        Buffer.from(
          'catalog.js' + secretNonce + (await aliceEvmWallet.getAddress())
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
      userBtcWalletAddress: await aliceBtcWallet.getAddress(),
      initiatorTimelock: '2',
      followerTimelock: '2',
      initiatorAmount: '100000',
      followerAmount: '99900',
      initiatorInitatorAddress: await aliceBtcWallet.getAddress(),
      initiatorRedeemerAddress: await bobBtcWallet.getAddress(),
      followerInitiatorAddress: await bobEvmWallet.getAddress(),
      followerRedeemerAddress: await aliceEvmWallet.getAddress(),
      initiatorChain: 'bitcoin_regtest',
      redeemerChain: 'ethereum_localnet',
      initiatorAsset: 'primary',
      followerAsset: contractAddress,
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
      await fund(await aliceBtcWallet.getAddress());

      const msg = trim0x(
        sha256(
          with0x(
            Buffer.from(
              'catalog.js' + secretNonce + (await aliceEvmWallet.getAddress())
            ).toString('hex')
          )
        )
      );
      const signedMessage = await aliceBtcWallet.sign(msg);
      const secret = trim0x(sha256(with0x(signedMessage)));
      const secretHash = sha256(with0x(secret));

      await fund(await bobEvmWallet.getAddress());
      await fund(await aliceEvmWallet.getAddress());

      const order = orderFactory({
        secret,
        secretHash,
        secretNonce,
        userBtcWalletAddress: await aliceBtcWallet.getAddress(),
        initiatorTimelock: '2',
        followerTimelock: '2',
        initiatorAmount: '100000',
        followerAmount: '99900',
        initiatorInitatorAddress: await aliceBtcWallet.getAddress(),
        initiatorRedeemerAddress: await bobBtcWallet.getAddress(),
        followerInitiatorAddress: await bobEvmWallet.getAddress(),
        followerRedeemerAddress: await aliceEvmWallet.getAddress(),
        initiatorChain: 'bitcoin_regtest',
        redeemerChain: 'ethereum_localnet',
        initiatorAsset: 'primary',
        followerAsset: contractAddress,
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

      expect(initiator).toEqual(await bobEvmWallet.getAddress());

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
      await fund(await bobBtcWallet.getAddress());
      const msg = trim0x(
        sha256(
          with0x(
            Buffer.from(
              'catalog.js' + secretNonce + (await aliceEvmWallet.getAddress())
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
        userBtcWalletAddress: await aliceBtcWallet.getAddress(),
        initiatorTimelock: '2',
        followerTimelock: '2',
        initiatorAmount: '100000',
        followerAmount: '99900',
        initiatorInitatorAddress: await aliceEvmWallet.getAddress(),
        initiatorRedeemerAddress: await bobEvmWallet.getAddress(),
        followerInitiatorAddress: await bobBtcWallet.getAddress(),
        followerRedeemerAddress: await aliceBtcWallet.getAddress(),
        initiatorChain: 'ethereum_localnet',
        redeemerChain: 'bitcoin_regtest',
        initiatorAsset: contractAddress,
        followerAsset: 'primary',
      });

      await fund(await aliceEvmWallet.getAddress());
      await fund(await bobEvmWallet.getAddress());

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

      expect(initiator).toEqual(await aliceEvmWallet.getAddress());

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
    let aliceSwapper;
    let bobSwapper;
    let order;
    let initialBtcBalance: number;
    beforeEach(async () => {
      //init
      const secretNonce = Date.now();
      //   await regTestUtils.fund(await bobBtcWallet.getAddress(), bitcoinProvider);
      await fund(await bobBtcWallet.getAddress());
      initialBtcBalance = await aliceBtcWallet.getBalance();

      const msg = trim0x(
        sha256(with0x(Buffer.from('catalog.js' + secretNonce).toString('hex')))
      );
      const signedMessage = await aliceBtcWallet.sign(msg);
      const secret = trim0x(sha256(with0x(signedMessage)));
      const secretHash = sha256(with0x(secret));

      order = orderFactory({
        secret,
        secretHash,
        secretNonce,
        userBtcWalletAddress: await aliceBtcWallet.getAddress(),
        initiatorTimelock: '2',
        followerTimelock: '2',
        initiatorAmount: '100000',
        followerAmount: '99900',
        initiatorInitatorAddress: await aliceEvmWallet.getAddress(),
        initiatorRedeemerAddress: await bobEvmWallet.getAddress(),
        followerInitiatorAddress: await bobBtcWallet.getAddress(),
        followerRedeemerAddress: await aliceBtcWallet.getAddress(),
        initiatorChain: 'ethereum_localnet',
        redeemerChain: 'bitcoin_regtest',
        initiatorAsset: contractAddress,
        followerAsset: 'primary',
      });

      //   await fundEvmAddress(evmProvider, await aliceEvmWallet.getAddress());
      //   await fundTokens(aliceEvmWallet, 11155111, contractAddress);
      await fund(await aliceEvmWallet.getAddress());

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
          BitcoinHTLCErrors.ORDER_NOT_EXPIRED
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
          await BitcoinWallet.createRandom(bitcoinProvider).getAddress()
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
