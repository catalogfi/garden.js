import {
    AtomicSwap,
    CONTRACT_ADDRESS,
    Chain,
    Order,
} from "@gardenfi/orderbook";
import { with0x } from "@catalogfi/utils";
import {
    Contract,
    Interface,
    AbiCoder,
    Wallet,
    sha256,
    JsonRpcProvider,
    parseUnits,
} from "ethers";

const atomicSwapFactory = ({
    secret,
    timelock,
    amount,
    initiatorAddress,
    redeemerAddress,
    chain,
    asset,
}: {
    secret: string;
    timelock: string;
    amount: string;
    initiatorAddress: string;
    redeemerAddress: string;
    chain: string;
    asset: string;
}): AtomicSwap => {
    return {
        ID: 0,
        CreatedAt: "",
        UpdatedAt: "",
        DeletedAt: "",
        swapStatus: 0,
        secret, //param
        initiatorAddress,
        redeemerAddress,
        onChainIdentifier: "",
        timelock, //param
        chain, //param
        asset,
        currentConfirmation: 0,
        minimumConfirmations: 0,
        amount, //param
        filledAmount: "",
        priceByOracle: 0,
        initiateTxHash: "",
        initiateBlockNumber: 0,
        redeemTxHash: "",
        refundTxHash: "",
    };
};

export const orderFactory = ({
    secret,
    secretHash,
    userBtcWalletAddress,
    secretNonce,
    initiatorTimelock,
    followerTimelock,
    initiatorAmount,
    followerAmount,
    initiatorInitatorAddress,
    initiatorRedeemerAddress,
    followerInitiatorAddress,
    followerRedeemerAddress,
    initiatorChain,
    redeemerChain,
    initiatorAsset,
    followerAsset,
}: {
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
}): Order => {
    return {
        ID: 0,
        CreatedAt: "",
        UpdatedAt: "",
        DeletedAt: "",
        maker: "",
        taker: "",
        orderPair: "",
        InitiatorAtomicSwapID: 0,
        FollowerAtomicSwapID: 0,
        initiatorAtomicSwap: atomicSwapFactory({
            secret,
            timelock: initiatorTimelock,
            amount: initiatorAmount,
            initiatorAddress: initiatorInitatorAddress,
            redeemerAddress: initiatorRedeemerAddress,
            chain: initiatorChain,
            asset: initiatorAsset,
        }),
        followerAtomicSwap: atomicSwapFactory({
            secret,
            timelock: followerTimelock,
            amount: followerAmount,
            initiatorAddress: followerInitiatorAddress,
            redeemerAddress: followerRedeemerAddress,
            chain: redeemerChain,
            asset: followerAsset,
        }),
        secretHash, //param
        secret, //param
        price: 0,
        status: 1,
        secretNonce,
        userBtcWalletAddress, //param
        RandomMultiplier: 0,
        RandomScore: 0,
        fee: 0,
    };
};

const abi = [
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "",
                type: "bytes32",
            },
        ],
        name: "atomicSwapOrders",
        outputs: [
            {
                internalType: "address",
                name: "redeemer",
                type: "address",
            },
            {
                internalType: "address",
                name: "initiator",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "expiry",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "initiatedAt",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "isFulfilled",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];

export const atomicSwapStatus = async (
    secretHash: string,
    initiator: Wallet
) => {
    const atomicSwap = new Contract(
        CONTRACT_ADDRESS[11155111].AtomicSwap,
        new Interface(JSON.stringify(abi)),
        initiator
    );

    const abiCoder = new AbiCoder();
    const orderId = sha256(
        abiCoder.encode(
            ["bytes32", "address"],
            [secretHash, await initiator.getAddress()]
        )
    );

    const orderResult = JSON.parse(
        JSON.stringify(
            await atomicSwap["atomicSwapOrders"](orderId),
            (key, value) =>
                typeof value === "bigint" ? value.toString() : value
        )
    );

    return {
        initiator: orderResult[1],
        fulfilled: orderResult[4],
    };
};

export const fundEvmAddress = async (
    provider: JsonRpcProvider,
    address: string,
    amount?: string
) => {
    await provider.send("tenderly_setBalance", [
        [address],
        with0x(parseUnits(amount ?? "10", "ether").toString(16)),
    ]);
};
