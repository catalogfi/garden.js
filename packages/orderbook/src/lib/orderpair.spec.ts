import { Assets } from './asset';
import { OrderpairErrors } from './errors';
import { orderPairGenerator } from './orderpair';

describe('order pair generator', () => {
  const wbtcToBtcOrderPair =
    'ethereum_sepolia:0x130Ff59B75a415d0bcCc2e996acAf27ce70fD5eF-bitcoin_testnet';
  const btcToWbtcOrderPair =
    'bitcoin_testnet-ethereum_sepolia:0x130Ff59B75a415d0bcCc2e996acAf27ce70fD5eF';
  it('should throw an error if the assets are the same', () => {
    expect(() =>
      orderPairGenerator(Assets.bitcoin.BTC, Assets.bitcoin.BTC)
    ).toThrowError(OrderpairErrors.SAME_ASSET);
  });

  it('should return the proper order pair when going from bitcoin', () => {
    const orderPair = orderPairGenerator(
      Assets.bitcoin_testnet.BTC,
      Assets.ethereum_sepolia.WBTC
    );
    expect(orderPair).toEqual(btcToWbtcOrderPair);
  });

  it('should return the proper order pair when going from ethereum', () => {
    const orderPair = orderPairGenerator(
      Assets.ethereum_sepolia.WBTC,
      Assets.bitcoin_testnet.BTC
    );

    expect(orderPair).toEqual(wbtcToBtcOrderPair);
  });
});
