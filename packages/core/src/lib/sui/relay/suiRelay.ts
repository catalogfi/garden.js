import { MatchedOrder } from "@gardenfi/orderbook";
import {
  APIResponse,
  AsyncResult,
  Err,
  Fetcher,
  Network,
  Ok,
  Url,
} from "@gardenfi/utils";
import { ISuiHTLC } from "../suiHTLC.types";
import {
  getFullnodeUrl,
  SuiClient,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Ed25519Keypair, Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import {
  SuiSignAndExecuteTransaction,
  SuiSignAndExecuteTransactionOutput,
  WalletWithRequiredFeatures,
} from "@mysten/wallet-standard";
import { SUI_CONFIG } from "../../constants";

export class SuiRelay implements ISuiHTLC {
  private client: SuiClient;
  private url: Url;
  private account: WalletWithRequiredFeatures | Ed25519Keypair;
  private network: Network;

  constructor(
    relayerUrl: string | Url,
    account: WalletWithRequiredFeatures | Ed25519Keypair,
    network: Network,
  ) {
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.url = relayerUrl instanceof Url ? relayerUrl : new Url(relayerUrl);
    this.account = account;
    this.network = network;
  }

  get htlcActorAddress(): string {
    if ("accounts" in this.account) {
      const suiBytes = new Ed25519PublicKey(
        this.account.accounts[0].publicKey,
      ).toRawBytes();
      const output = Buffer.from(suiBytes.slice(1)).toString("hex");
      console.log("output", output);
      return output;
    }

    return Buffer.from(this.account.getPublicKey().toRawBytes()).toString(
      "hex",
    );
  }

  get userSuiAddress(): string {
    return "accounts" in this.account
      ? this.account.accounts[0].address
      : this.account.toSuiAddress();
  }

  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    try {
      const { source_swap } = order;

      const amount = BigInt(source_swap.amount);
      const registryId =
        "0x82e72404d3fa1ce75dba83b1d53005488ace8287cd0467852e0bab7367952053";
      const solverPubKey = source_swap.redeemer;
      const secretHash = source_swap.secret_hash;

      const userPubKeyBytes =
        "accounts" in this.account
          ? this.account.accounts[0].publicKey
          : this.account.getPublicKey().toRawBytes();
      const counterPartyAddressBytes = Buffer.from(solverPubKey, "hex");

      const tx = new Transaction();
      tx.setGasBudget(100000000);
      tx.setSender(this.userSuiAddress);

      const [coin] = tx.splitCoins(tx.gas, [amount]);

      tx.moveCall({
        target: `${SUI_CONFIG[this.network].packageId}::${
          SUI_CONFIG[this.network].moduleName
        }::initiate_swap`,
        typeArguments: [source_swap.token_address],
        arguments: [
          tx.object(registryId),
          tx.pure.vector("u8", userPubKeyBytes),
          tx.pure.vector("u8", counterPartyAddressBytes),
          tx.pure.vector("u8", Buffer.from(secretHash, "hex")),
          tx.pure.u64(amount),
          tx.pure.u256(source_swap.timelock),
          tx.pure.vector("u8", Buffer.from("")),
          coin,
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });

      const data = await tx.build({ client: this.client });

      const dryRunResult = await this.client.dryRunTransactionBlock({
        transactionBlock: data,
      });
      if (dryRunResult.effects.status.status === "failure") {
        return Err(`${dryRunResult.effects.status.error}`);
      }

      let initResult:
        | SuiSignAndExecuteTransactionOutput
        | SuiTransactionBlockResponse
        | undefined;
      if ("features" in this.account) {
        initResult = await this.account.features[
          SuiSignAndExecuteTransaction
        ]?.signAndExecuteTransaction({
          transaction: tx,
          account: this.account.accounts[0],
          chain: this.account.chains[0],
        });
      } else {
        initResult = await this.client.signAndExecuteTransaction({
          signer: this.account,
          transaction: tx,
          options: {
            showEffects: true,
          },
        });
      }
      if (!initResult) {
        return Err(`Failed to initiate`);
      }

      const transaction = await this.client.waitForTransaction({
        digest: initResult.digest,
        options: {
          showEffects: true,
        },
      });
      if (transaction.effects?.status.status === "failure") {
        return Err(`Failed to initiate: ${transaction.effects?.status.error}`);
      }

      return Ok(transaction.digest);
    } catch (error) {
      return Err(error as string);
    }
  }

  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint("redeem"),
        {
          body: JSON.stringify({
            order_id: order.create_order.create_id,
            secret: secret,
            perform_on: "Destination",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          retryCount: 10,
          retryDelay: 2000,
        },
      );

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err("Redeem: No result found");
    } catch (error) {
      return Err(String(error));
    }
  }

  async refund(): AsyncResult<string, string> {
    return Err("Refund is taken care of by the relayer");
  }
}
