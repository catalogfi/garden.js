import { exec } from 'child_process';
import { Asset, Chains, Chain as Network } from '@gardenfi/orderbook';
import {
  Contract,
  Interface,
  AbiCoder,
  Wallet,
  sha256,
  JsonRpcProvider,
} from 'ethers';
import { Fetcher } from '@catalogfi/utils';
import { Chain } from 'viem';
import { SwapParams } from './garden/garden.types';

export const fund = async (address: string) => {
  exec(`merry faucet --to ${address}`);

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 5000);
  });
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
  contractAddress: string,
) => {
  const atomicSwap = new Contract(
    contractAddress,
    new Interface(JSON.stringify(abi)),
    initiator,
  );

  const abiCoder = new AbiCoder();

  const orderId = sha256(
    abiCoder.encode(
      ['bytes32', 'address'],
      [secretHash, await initiator.getAddress()],
    ),
  );

  const orderResult = JSON.parse(
    JSON.stringify(await atomicSwap['orders'](orderId), (key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
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
  blocks: number,
) => {
  return await provider.send('anvil_mine', [
    '0x' + Number(blocks).toString(16),
  ]);
};

export const ArbitrumLocalnet: Chain = {
  id: 31338,
  name: 'Arbitrum Localnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8546/'],
    },
  },
  testnet: true,
};
export const EthereumLocalnet: Chain = {
  id: 31337,
  name: 'Ethereum Localnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545/'],
    },
  },
  testnet: true,
};

export const bitcoinAsset: Asset = {
  name: 'Bitcoin Regtest',
  decimals: 8,
  symbol: 'BTC',
  chain: Chains.bitcoin_regtest,
  atomicSwapAddress: 'primary',
  tokenAddress: 'primary',
  isToken: true,
};
export const WBTCArbitrumLocalnetAsset: Asset = {
  name: 'WBTC Arbitrum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.arbitrum_localnet,
  atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  isToken: true,
};
export const WBTCEthereumLocalnetAsset: Asset = {
  name: 'WBTC Ethereum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.ethereum_localnet,
  atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  isToken: true,
};

export const getBitcoinCurrentBlock = async (api: string) => {
  const res = await Fetcher.get<number>(`${api}/blocks/tip/height`);
  return res;
};

export const createOrderObject = (
  fromChain: Network,
  toChain: Network,
  fromAddress: string,
  toAddress: string,
  btcAddress?: string,
) => {
  const sendAmount = '100000';
  const receiveAmount = '99000';
  const fromAsset =
    fromChain === Chains.arbitrum_localnet
      ? WBTCArbitrumLocalnetAsset
      : fromChain === Chains.ethereum_localnet
      ? WBTCEthereumLocalnetAsset
      : bitcoinAsset;
  const toAsset =
    toChain === Chains.arbitrum_localnet
      ? WBTCArbitrumLocalnetAsset
      : toChain === Chains.ethereum_localnet
      ? WBTCEthereumLocalnetAsset
      : bitcoinAsset;
  const additionalData = btcAddress ? { btcAddress } : undefined;

  const order: SwapParams = {
    fromAsset,
    toAsset,
    sendAddress: fromAddress,
    receiveAddress: toAddress,
    sendAmount,
    receiveAmount,
    additionalData,
    minDestinationConfirmations: 3,
  };
  return order;
};