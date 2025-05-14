import { WALLET_CONFIG } from "./../../constants";
import {
  Balance,
  Connect,
  IInjectedBitcoinProvider,
} from "../../bitcoin.types";
import {
  XverseBitcoinNetworkType,
  XVerseBitcoinProvider,
} from "./xverse.types";
import { AsyncResult, Err, executeWithTryCatch, Ok } from "@catalogfi/utils";
import { Network } from "@gardenfi/utils";

export class XverseProvider implements IInjectedBitcoinProvider {
  #xverseProvider: XVerseBitcoinProvider;
  public address = "";
  public id = WALLET_CONFIG.Xverse.id;
  public name = WALLET_CONFIG.Xverse.name;
  public icon = WALLET_CONFIG.Xverse.icon;

  constructor(provider: XVerseBitcoinProvider) {
    this.#xverseProvider = provider;
  }

  connect = async (network?: Network): AsyncResult<Connect, string> => {
    try {
      if (!network) network = Network.MAINNET;

      await this.#xverseProvider.request("wallet_connect", null);

      const currentNetwork = await this.getNetwork();
      if (currentNetwork.error)
        return Err("Could not get network", currentNetwork.error);

      if (currentNetwork.val !== network) {
        const switchRes = await this.switchNetwork();
        if (switchRes.error)
          return Err("Failed to switch network", switchRes.error);
      }
      const addresses = await this.getAccounts();
      if (addresses.val.length > 0) {
        this.address = addresses.val[0];
      }

      return Ok({
        address: this.address,
        provider: this,
        network: network,
        id: WALLET_CONFIG.Xverse.id,
      });
    } catch (error) {
      return Err("Error while connecting to the XVerse wallet", error);
    }
  };

  getBalance = async () => {
    return await executeWithTryCatch(async () => {
      const response = await this.#xverseProvider.request("getBalance", {});
      return response.result as Balance;
    }, "Error while getting balance from XVerse wallet");
  };

  requestAccounts = async (): AsyncResult<string[], string> => {
    return await executeWithTryCatch(async () => {
      const res = await this.#xverseProvider.request("getAccounts", {
        purposes: ["payment"],
        message: "I want to connect",
      });
      return res.result.map((acc: any) => acc.address);
    });
  };

  getAccounts = async (): AsyncResult<string[], string> => {
    return await executeWithTryCatch(async () => {
      const res = await this.#xverseProvider.request("getAddresses", {
        purposes: ["payment"],
      });
      return res.result.addresses.map((acc: any) => acc.address);
    });
  };

  sendBitcoin = async (
    toAddress: string,
    satoshis: number,
  ): AsyncResult<string, string> => {
    return await executeWithTryCatch(async () => {
      const res = await this.#xverseProvider.request("sendTransfer", {
        recipients: [{ address: toAddress, amount: satoshis }],
      });
      const txid = res.result?.txid;
      if (txid) {
        return Ok(txid);
      } else {
        throw new Error(res.error);
      }
    }, "Error while sending bitcoin from Xverse wallet");
  };

  async getNetwork() {
    return await executeWithTryCatch(async () => {
      const network = await this.#xverseProvider.request(
        "wallet_getNetwork",
        null,
      );
      if (network.result.bitcoin.name === XverseBitcoinNetworkType.Mainnet) {
        return Network.MAINNET;
      } else if (
        network.result.bitcoin.name === XverseBitcoinNetworkType.Testnet4
      ) {
        return Network.TESTNET;
      }
      throw new Error(network.result);
    }, "Error while getting network from Xverse wallet");
  }

  async switchNetwork(): AsyncResult<Network, string> {
    try {
      const currentNetwork = await this.getNetwork();
      if (currentNetwork.error) {
        return Err("Failed to get current network");
      }

      const toNetwork =
        currentNetwork.val === Network.MAINNET
          ? XverseBitcoinNetworkType.Testnet4
          : XverseBitcoinNetworkType.Mainnet;

      await this.#xverseProvider.request("wallet_changeNetwork", {
        name: toNetwork,
      });

      const newNetwork = await this.getNetwork();
      if (newNetwork.error) {
        return Err("Failed to verify network switch");
      }

      return Ok(newNetwork.val);
    } catch (error) {
      return Err("Error while switching network in Xverse:", error);
    }
  }

  /**
   * not available in XVerse wallet
   */
  on = () => {};

  /**
   * not available in XVerse wallet
   */
  off = () => {};

  disconnect = (): AsyncResult<string, string> => {
    this.address = "";
    return Promise.resolve(Ok("Disconnected"));
  };
}
