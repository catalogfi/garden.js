import { Assets } from "./asset";
import { OrderpairErrors } from "./errors";
import { orderPairGenerator } from "./orderpair";

describe("order pair generator", () => {
  const wbtcToBtcOrderPair =
    "ethereum_sepolia:0x9ceD08aeE17Fbc333BB7741Ec5eB2907b0CA4241-bitcoin_testnet";
  const btcToWbtcOrderPair =
    "bitcoin_testnet-ethereum_sepolia:0x9ceD08aeE17Fbc333BB7741Ec5eB2907b0CA4241";
  const regtestOrderPair =
    "bitcoin_regtest-ethereum_sepolia:0x9ceD08aeE17Fbc333BB7741Ec5eB2907b0CA4241";

  it("should throw an error if the assets are the same", () => {
    expect(() =>
      orderPairGenerator(Assets.bitcoin.BTC, Assets.bitcoin.BTC)
    ).toThrow(OrderpairErrors.SAME_ASSET);
  });

  it("should return the proper order pair when going from bitcoin", () => {
    const orderPair = orderPairGenerator(
      Assets.bitcoin_testnet.BTC,
      Assets.ethereum_sepolia.WBTC
    );
    expect(orderPair).toEqual(btcToWbtcOrderPair);
  });

  it("should return the proper order pair when going from ethereum", () => {
    const orderPair = orderPairGenerator(
      Assets.ethereum_sepolia.WBTC,
      Assets.bitcoin_testnet.BTC
    );

    expect(orderPair).toEqual(wbtcToBtcOrderPair);
  });

  it("should return the proper order pair when going from regtest", () => {
    const orderPair = orderPairGenerator(
      Assets.bitcoin_regtest.BTC,
      Assets.ethereum_sepolia.WBTC
    );

    expect(orderPair).toEqual(regtestOrderPair);
  });
});
