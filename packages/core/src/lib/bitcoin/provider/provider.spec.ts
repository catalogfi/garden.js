import { BitcoinProvider } from './provider';
import { BitcoinNetwork, BitcoinTxType, Urgency } from './provider.interface';
import { describe, test, expect } from 'vitest';

describe.only('BitcoinProvider', () => {
  const provider = new BitcoinProvider(BitcoinNetwork.Mainnet);

  test('Should not initiate with invalid network', () => {
    expect(() => new BitcoinProvider('invalid' as BitcoinNetwork)).toThrow();
  });
  test('Should get UTXOs', async () => {
    let utxos = await provider.getUTXOs(
      'tb1qkgtrykrq0257a0t7u3gyadwmflwex8f8yza74r',
    );
    expect(utxos.length).toBeGreaterThan(0);
    await expect(
      async () =>
        await provider.getUTXOs(
          'tb1qkgtrykrq0257a0t7u3gyadwmflwex8f8yza74p',
          100,
        ),
    ).rejects.toThrow();

    utxos = await provider.getUTXOs('mooWwCfnH6PE7pmmKNmNAwbMCSXHq2rLBY', 1000);
    const bal = utxos.reduce((acc, tx) => acc + tx.value, 0);
    expect(bal).toBeGreaterThan(1000);
  }, 100000);

  test('Should return the lowest number of utxos', async () => {
    const utxos = await provider.getUTXOs(
      'tb1qkgtrykrq0257a0t7u3gyadwmflwex8f8yza74r',
    );

    const balance = 1912975;
    utxos.sort((a, b) => b.value - a.value);
    let sum = 0;
    for (const utxo of utxos) {
      if (sum >= balance) break;
      sum += utxo.value;
    }

    const utxosWithBalance = await provider.getUTXOs(
      'tb1qkgtrykrq0257a0t7u3gyadwmflwex8f8yza74r',
      balance,
    );

    const greedySum = utxosWithBalance.reduce(
      (prev, curr) => prev + curr.value,
      0,
    );

    expect(greedySum).toEqual(sum);
  }, 100000);
  test('should be able to get the balance', async () => {
    const balance = await provider.getBalance(
      'mooWwCfnH6PE7pmmKNmNAwbMCSXHq2rLBY',
    );
    expect(balance).toBeGreaterThan(0);
  }, 100000);

  test('should be able to get the tx hex', async () => {
    const hex = await provider.getTransactionHex(
      '10ce777f991e40282c5254db64203ec0b9ab50572be7b279fbc5cfbccad9ae7e',
    );
    expect(hex).toEqual(
      '02000000000101fd081e6c2ea2248194f9fa124bee75c4800fc35217e7e3ccf12fe4df8ab9056d0000000000ffffffff020804000000000000220020eaf3c99270808f07be6561c0abfae4ae43a0a726927f378bd5706d4315ad236834080000000000001976a9145ae2e8977b007c3a9bb57f35f488369bbc24df0388ac04004730440220588c63ad7d55add303a7553d1a16314371fe74fc24c361fa611393ae08a0125702201f7bdd25a76bb163cef33e318782ca1ff482d4f58704a0f04fab31516cf72e480148304502210091dcfb6b0754a961d868801f256a71084b65095d1ada2fc4c37accdaf94409ab022021eeeb4e81a15790521916bd7bf9fb64a61629d1d87b2d35f1ad4b8c0126a3bd016a2103fa8d52df8bab9bbc4b300481d0286d49e53b9f81109f2036398ad0f574817aec75522103ce6569775f2bf4387536fcdd445ecaccf94dd179591730e5983bd189e300fdae2103fa8d52df8bab9bbc4b300481d0286d49e53b9f81109f2036398ad0f574817aec52ae00000000',
    );
  }, 10000);

  test('should be able to get fee rates', async () => {
    const feeRates = await provider.getFeeRates();
    expect(feeRates).toHaveProperty('fastestFee');
    expect(feeRates).toHaveProperty('halfHourFee');
    expect(feeRates).toHaveProperty('hourFee');
    expect(feeRates).toHaveProperty('economyFee');
    expect(feeRates).toHaveProperty('minimumFee');
    expect(feeRates.fastestFee).toBeGreaterThan(1);
    expect(feeRates.halfHourFee).toBeGreaterThan(1);
    expect(feeRates.hourFee).toBeGreaterThan(1);

    const mainnetRates = await new BitcoinProvider(
      BitcoinNetwork.Mainnet,
    ).getFeeRates();
    expect(mainnetRates).toHaveProperty('fastestFee');
    expect(mainnetRates).toHaveProperty('halfHourFee');
    expect(mainnetRates).toHaveProperty('hourFee');
    expect(mainnetRates).toHaveProperty('economyFee');
    expect(mainnetRates).toHaveProperty('minimumFee');
    expect(mainnetRates.fastestFee).toBeGreaterThan(1);
  }, 10000);

  test('should be able to get txs', async () => {
    let txs = await provider.getTransactions(
      'tb1q0y7uxx9pzfur24jh087mq9ldtmyaxrpaxraf6nzw5ka62fav32zs4gc468',
      BitcoinTxType.ALL,
    );

    expect(txs.length).toBeGreaterThanOrEqual(2);
    txs = await provider.getTransactions(
      'tb1q0y7uxx9pzfur24jh087mq9ldtmyaxrpaxraf6nzw5ka62fav32zs4gc468',
      BitcoinTxType.IN,
    );
    expect(txs.at(0)?.txid).toEqual(
      'd569ab1ea9c4e1eff7eb60b6bd91e3ea25f825663b7bfe2bf27eb9bf9613ecb7',
    );
    txs = await provider.getTransactions(
      'tb1q0y7uxx9pzfur24jh087mq9ldtmyaxrpaxraf6nzw5ka62fav32zs4gc468',
      BitcoinTxType.OUT,
    );
    expect(txs.at(0)?.txid).toEqual(
      'd4bc360d657aac48f8426c55171415d370ff443100398970977c1c9b6184b9c3',
    );
  }, 10000);
  test("should get latest block's height", async () => {
    const height = await provider.getLatestTip();
    expect(height).toBeGreaterThanOrEqual(2533623);
  });
  test('should get network', () => {
    expect(provider.getNetwork()).toEqual(BitcoinNetwork.Testnet);
  });
  test('should suggest fee', async () => {
    const fee = await provider.suggestFee(
      'mooWwCfnH6PE7pmmKNmNAwbMCSXHq2rLBY',
      1000,
      Urgency.SLOW,
    );
    const mediumFee = await provider.suggestFee(
      'mooWwCfnH6PE7pmmKNmNAwbMCSXHq2rLBY',
      1000,
      Urgency.MEDIUM,
    );
    const fastFee = await provider.suggestFee(
      'mooWwCfnH6PE7pmmKNmNAwbMCSXHq2rLBY',
      1000,
      Urgency.FAST,
    );
    expect(fee).toBeGreaterThan(500);
    expect(mediumFee).toBeGreaterThan(750);
    expect(fastFee).toBeGreaterThan(1000);
  }, 100000);

  test('should be able to broadcast tx', async () => {
    const txHex = await provider.getTransactionHex(
      '10ce777f991e40282c5254db64203ec0b9ab50572be7b279fbc5cfbccad9ae7e',
    );
    await expect(async () => await provider.broadcast(txHex)).rejects.toThrow();
  });

  test('should be able to get transaction times', async () => {
    const times = await provider.getTransactionTimes([
      '7eca68bb8f6cff999194b61515ed3b691685d97ba1d0ab133d0a609043e5c67f',
    ]);
    console.log('times :', times);
  });
});
