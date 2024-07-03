import { exec } from 'child_process';
import { AtomicSwap, Order } from '@gardenfi/orderbook';
import {
  Contract,
  Interface,
  AbiCoder,
  Wallet,
  sha256,
  JsonRpcProvider,
} from 'ethers';
import { Fetcher } from '@catalogfi/utils';

export const fund = async (address: string) => {
  exec(`merry faucet --to ${address}`);

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 5000);
  });
};

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
    CreatedAt: '',
    UpdatedAt: '',
    DeletedAt: '',
    swapStatus: 0,
    secret, //param
    initiatorAddress,
    redeemerAddress,
    onChainIdentifier: '',
    timelock, //param
    chain, //param
    asset,
    currentConfirmation: 0,
    minimumConfirmations: 0,
    amount, //param
    filledAmount: '',
    priceByOracle: 0,
    initiateTxHash: '',
    initiateBlockNumber: 0,
    redeemTxHash: '',
    refundTxHash: '',
  };
};

export const orderFactory = ({
  secret,
  secretHash,
  secretNonce,
  initiatorInitatorAddress,
  initiatorRedeemerAddress,
  followerInitiatorAddress,
  followerRedeemerAddress,
  fromBitcoin,
  contractAddress,
}: {
  secret: string;
  secretHash: string;
  secretNonce: number;
  initiatorInitatorAddress: string;
  initiatorRedeemerAddress: string;
  followerInitiatorAddress: string;
  followerRedeemerAddress: string;
  fromBitcoin: boolean;
  contractAddress: string;
}): Order => {
  return {
    ID: 0,
    CreatedAt: '',
    UpdatedAt: '',
    DeletedAt: '',
    maker: '',
    taker: '',
    orderPair: '',
    InitiatorAtomicSwapID: 0,
    FollowerAtomicSwapID: 0,
    initiatorAtomicSwap: atomicSwapFactory({
      secret,
      timelock: '2',
      amount: '100000',
      initiatorAddress: initiatorInitatorAddress,
      redeemerAddress: initiatorRedeemerAddress,
      chain: fromBitcoin ? 'bitcoin_regtest' : 'ethereum_localnet',
      asset: fromBitcoin ? 'primary' : contractAddress,
    }),
    followerAtomicSwap: atomicSwapFactory({
      secret,
      timelock: '2',
      amount: '99900',
      initiatorAddress: followerInitiatorAddress,
      redeemerAddress: followerRedeemerAddress,
      chain: fromBitcoin ? 'ethereum_localnet' : 'bitcoin_regtest',
      asset: fromBitcoin ? contractAddress : 'primary',
    }),
    secretHash, //param
    secret, //param
    price: 0,
    status: 1,
    secretNonce,
    userBtcWalletAddress: initiatorInitatorAddress, //param
    RandomMultiplier: 0,
    RandomScore: 0,
    fee: 0,
  };
};

const abi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'orders',
    outputs: [
      {
        internalType: 'address',
        name: 'redeemer',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'initiator',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'expiry',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'initiatedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isFulfilled',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export const atomicSwapStatus = async (
  secretHash: string,
  initiator: Wallet,
  contractAddress: string
) => {
  const atomicSwap = new Contract(
    contractAddress,
    new Interface(JSON.stringify(abi)),
    initiator
  );

  const abiCoder = new AbiCoder();

  const orderId = sha256(
    abiCoder.encode(
      ['bytes32', 'address'],
      [secretHash, await initiator.getAddress()]
    )
  );

  const orderResult = JSON.parse(
    JSON.stringify(await atomicSwap['orders'](orderId), (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );

  return {
    initiator: orderResult[1],
    fulfilled: orderResult[4],
  };
};

export const mineBtcBlocks = async (blocks: number, address: string) => {
  const body = {
    jsonrpc: '1.0',
    id: 'mine',
    method: 'generatetoaddress',
    params: [blocks, address],
  };

  const headers = new Headers({
    Authorization: `Basic ${btoa('admin1:123')}`,
  });

  const response = await Fetcher.post('http://localhost:18443/', {
    headers,
    body: JSON.stringify(body),
  });

  return response;
};

export const mineEvmBlocks = async (
  provider: JsonRpcProvider,
  blocks: number
) => {
  return await provider.send('anvil_mine', [
    '0x' + Number(blocks).toString(16),
  ]);
};
