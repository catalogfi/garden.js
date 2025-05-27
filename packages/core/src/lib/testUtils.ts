import { exec } from 'child_process';
import { Asset, Chains, Chain as Network } from '@gardenfi/orderbook';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Chain } from 'viem';
import { SwapParams } from './garden/garden.types';
import { Fetcher } from '@gardenfi/utils';
import { IBitcoinProvider } from './bitcoin/provider/provider.interface';
import ECPairFactory from 'ecpair';

export const fund = async (address: string) => {
  exec(`merry faucet --to ${address}`);

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 5000);
  });
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

// export const mineEvmBlocks = async (
//   provider: JSOnP,
//   blocks: number,
// ) => {
//   return await provider.send('anvil_mine', [
//     '0x' + Number(blocks).toString(16),
//   ]);
// };

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

export const bitcoinRegtestAsset: Asset = {
  name: 'Bitcoin Regtest',
  decimals: 8,
  symbol: 'BTC',
  chain: Chains.bitcoin_regtest,
  atomicSwapAddress: 'primary',
  tokenAddress: 'primary',
};
export const WBTCArbitrumLocalnetAsset: Asset = {
  name: 'WBTC Arbitrum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.arbitrum_localnet,
  atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
};
export const WBTCEthereumLocalnetAsset: Asset = {
  name: 'WBTC Ethereum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.ethereum_localnet,
  atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

export const getBitcoinCurrentBlock = async (api: string) => {
  const res = await Fetcher.get<number>(`${api}/blocks/tip/height`);
  return res;
};

export const createOrderObject = (
  fromChain: Network,
  toChain: Network,
  strategyId: string,
  btcAddress?: string,
) => {
  const sendAmount = 1_00_000;
  const receiveAmount = 99_700;
  const fromAsset =
    fromChain === Chains.arbitrum_localnet
      ? WBTCArbitrumLocalnetAsset
      : fromChain === Chains.ethereum_localnet
      ? WBTCEthereumLocalnetAsset
      : bitcoinRegtestAsset;
  const toAsset =
    toChain === Chains.arbitrum_localnet
      ? WBTCArbitrumLocalnetAsset
      : toChain === Chains.ethereum_localnet
      ? WBTCEthereumLocalnetAsset
      : bitcoinRegtestAsset;

  const additionalData = { btcAddress, strategyId };

  const order: SwapParams = {
    fromAsset,
    toAsset,
    sendAmount: sendAmount.toString(),
    receiveAmount: receiveAmount.toString(),
    additionalData,
    minDestinationConfirmations: 3,
  };
  return order;
};

export class regTestUtils {
  static async mine(blocks: number, provider: IBitcoinProvider) {
    const block = await provider.getLatestTip();
    exec(`merry rpc --generate ${blocks}`, (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      if (stderr) {
        throw new Error(stderr);
      }
    });
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const newBlock = await provider.getLatestTip();
      if (newBlock > block) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  /**
   * funds the address with 1 BTC
   */
  static async fund(address: string, provider: IBitcoinProvider) {
    const balance = await provider.getBalance(address);
    exec(`merry faucet --to ${address}`, async (error, stdout, stderr) => {
      if (error) {
        throw error;
      }
      if (stderr) {
        throw new Error(stderr);
      }
      await this.mine(10, provider);
    });
    while ((await provider.getBalance(address)) === balance) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export const getSignerFromPk = async (pk: string, network: bitcoin.Network) => {
  return ECPairFactory(ecc).fromPrivateKey(Buffer.from(pk, 'hex'), {
    network,
  });
};

export const getScript = (network: bitcoin.Network, type: 'p2sh' | 'p2wsh') => {
  const script = bitcoin.script.fromASM(
    `
        OP_ADD
        ${bitcoin.script.number.encode(4).toString('hex')}
        OP_EQUALVERIFY
        OP_CHECKSIG
    `
      .trim()
      .replace(/\s+/g, ' '),
  );

  const payment = bitcoin.payments[type]({
    redeem: {
      output: script,
    },
    network,
  });

  if (!payment.address) throw new Error('Could not build address');

  return {
    script,
    address: payment.address,
  };
};
