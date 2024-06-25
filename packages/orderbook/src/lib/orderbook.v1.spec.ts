import { JsonRpcProvider, Wallet } from "ethers";
import { describe, it, expect } from "vitest";
import { Orderbook } from "./orderbook";

// TODO: All the tests have to be migrated to vitest

describe("orderbook", async () => {
  // to run these tests, you need to have local ganache running on port 8545
  // and the orderbook server running on port 8080

  const provider = new JsonRpcProvider("http://localhost:8545");
  const privateKey = Wallet.createRandom().privateKey;
  const wallet = new Wallet(privateKey, provider);

  const orderbook = await Orderbook.init({
    url: "http://localhost:8080",
    signer: wallet,
  });

  it("should be able to get supported assets", async () => {
    const assets = await orderbook.getSupportedContracts();
    expect(assets).toBeDefined();
    // bitcoin_regtest, ethereum_localnet, ethereum_arbitrumlocalnet
    expect(assets.bitcoin_regtest).toBeDefined();
    expect(assets.ethereum_localnet).toBeDefined();
    expect(assets.ethereum_arbitrumlocalnet).toBeDefined();
    expect(assets.bitcoin_regtest).toBe("primary");
    expect(assets.ethereum_localnet).toBe(
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    );
    expect(assets.ethereum_arbitrumlocalnet).toBe(
      "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    );
  });
});
