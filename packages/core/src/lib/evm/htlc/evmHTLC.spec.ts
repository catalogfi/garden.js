import { Chains, MatchedOrder, SupportedAssets } from '@gardenfi/orderbook';
import { Environment, with0x, DigestKey } from '@gardenfi/utils';
import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { sleep } from '@catalogfi/utils';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { Garden } from '../../garden/garden';
import { IGardenJS, SwapParams } from '../../garden/garden.types';
import { EVMHTLC } from './evmHTLC';
// import { createSmartAccountClient } from 'permissionless';
// import { toKernelSmartAccount } from 'permissionless/accounts';
// import { entryPoint07Address } from 'viem/account-abstraction';
// import { createPimlicoClient } from 'permissionless/clients/pimlico';
// import { prepareUserOperationForErc20Paymaster } from 'permissionless/experimental/pimlico';

describe('StarkNet Integration Tests', async () => {
  const EVM_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  // const DIGEST_KEY =
  //   '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';
  const DIGEST_KEY = DigestKey.generateRandom().val;

  const evmAccount = privateKeyToAccount(with0x(EVM_PRIVATE_KEY));
  const evmWallet = createWalletClient({
    account: evmAccount,
    chain: sepolia,
    transport: http(),
  });
  console.log('EVM Account Address:', evmWallet.account.address);
  const garden = new Garden({
    environment: Environment.TESTNET,
    digestKey: DIGEST_KEY!,
    htlc: {
      evm: new EVMHTLC(evmWallet),
    },
  });

  const setupEventListeners = (garden: IGardenJS) => {
    garden.on('error', (order, error) => {
      console.log(
        'Error while executing ❌, orderId:',
        order.create_order.create_id,
        'error:',
        error,
      );
    });

    garden.on('success', (order, action, result) => {
      console.log(
        'Executed ✅, orderId:',
        order.create_order.create_id,
        'action:',
        action,
        'result:',
        result,
      );
    });

    garden.on('log', (id, message) => {
      console.log('Log:', id, message);
    });

    garden.on('onPendingOrdersChanged', (orders) => {
      console.log('⏳Pending orders:', orders.length);
      orders.forEach((order) => {
        console.log(
          'Order id :',
          order.create_order.create_id,
          'status :',
          order.status,
        );
      });
    });

    garden.on('rbf', (order, result) => {
      console.log('RBF:', order.create_order.create_id, result);
    });
  };
  let matchedOrder: MatchedOrder;

  describe.only('eth-arb swap', async () => {
    it('should create and execute a ETH swap', async () => {
      const order: SwapParams = {
        fromAsset: SupportedAssets.testnet.ethereum_sepolia_WBTC,
        toAsset: {
          name: 'Wrapped Bitcoin',
          decimals: 8,
          symbol: 'WBTC',
          logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
          chain: Chains.arbitrum_sepolia,
          tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
          atomicSwapAddress: '0xE918A5a47b8e0AFAC2382bC5D1e981613e63fB07',
        },
        sendAmount: '100000',
        receiveAmount: '99200',
        additionalData: {
          strategyId: 'ea56aa70',
        },
      };
      const result = await garden.swap(order);
      if (result.error) {
        console.log('Error while creating order ❌:', result.error);
        throw new Error(result.error);
      }
      console.log(
        'Order created and matched ✅',
        result.val.create_order.create_id,
      );
      matchedOrder = result.val;
      expect(result.error).toBeFalsy();
      expect(result.val).toBeTruthy();
    }, 150000);

    it('Initiate the swap', async () => {
      const res = await garden.evmHTLC?.initiate(matchedOrder);
      console.log('initiated ✅ :', res?.val);
      if (res?.error) console.log('init error ❌ :', res.error);
      expect(res?.ok).toBeTruthy();
    }, 150000);

    it('Execute', async () => {
      setupEventListeners(garden);
      await garden.execute();
      await sleep(150000);
    }, 150000);
  });
});

// Signature for initiate: 0x018104e3Ad430EA6d354d013A6789fDFc71E671c43b6ddc2a09cff7c26e01236402c1ff9910972c986e65d72f2162fd27cca9c36a13095491293fc06f603d7a2361b1a9dad301b6c137d3c540b9b0951f626dc197d1c orderId: 4163445f15761de6dccebb33d05bbe97800051bebadd4357f19ca37ccc220f1b
// Signature for initiate: 0x6c9e8f0d6cf2b4535a1f0635225fcca4f0832527a587b0a510744bc7306586e11c61e470f9fa1931a0ac80dbf359524285b67efcf4b5b253c3a720a1ee46694b1c
