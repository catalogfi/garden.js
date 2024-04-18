import { Chain } from "@gardenfi/orderbook";
import { Wallet, JsonRpcProvider } from "ethers";
export declare const orderFactory: ({ secret, secretHash, userBtcWalletAddress, secretNonce, initiatorTimelock, followerTimelock, initiatorAmount, followerAmount, initiatorInitatorAddress, initiatorRedeemerAddress, followerInitiatorAddress, followerRedeemerAddress, initiatorChain, redeemerChain, initiatorAsset, followerAsset, }: {
    secret: string;
    secretHash: string;
    secretNonce: number;
    userBtcWalletAddress: string;
    initiatorTimelock: string;
    followerTimelock: string;
    initiatorAmount: string;
    followerAmount: string;
    initiatorInitatorAddress: string;
    initiatorRedeemerAddress: string;
    followerInitiatorAddress: string;
    followerRedeemerAddress: string;
    initiatorChain: Chain;
    redeemerChain: Chain;
    initiatorAsset: string;
    followerAsset: string;
}) => Order;
export declare const atomicSwapStatus: (secretHash: string, initiator: Wallet) => Promise<{
    initiator: any;
    fulfilled: any;
}>;
export declare const fundEvmAddress: (provider: JsonRpcProvider, address: string, amount?: string) => Promise<void>;
