import { describe, expect, it } from 'vitest';
import { isExpired, ParseOrderStatus } from './orderStatusParser';
import { OrdersProvider } from '@gardenfi/orderbook';
import { BlockNumberFetcher } from './blockNumber';

describe('orderStatus', () => {
  it('test IsExpired', async () => {
    const res1 = isExpired(Date.now(), 1);
    const res2 = isExpired(1729608769, 1);
    expect(res1).toBe(false);
    expect(res2).toBe(true);
  });
  it('status', async () => {
    const blockNumberFetcher = new BlockNumberFetcher(
      'https://prod-mainnet-virtual-balance-pr-5.onrender.com/',
      'testnet',
    );
    const blockNumbers = await blockNumberFetcher.fetchBlockNumbers();
    console.log('blockNumbers :', blockNumbers.val);
    if (blockNumbers.error) {
      throw new Error(blockNumbers.error);
    }

    const ordersProvider = new OrdersProvider(
      'https://evm-swapper-relay.onrender.com/',
    );
    const order = await ordersProvider.getOrder(
      'fc4af7392d557aaa430e5423c18f0360b66c69a0d15b9333ab13648cf9dd11ae',
      true,
    );
    if (order.error) {
      throw new Error(order.error);
    }

    const status = ParseOrderStatus(
      order.val,
      blockNumbers.val[order.val.source_swap.chain],
      blockNumbers.val[order.val.destination_swap.chain],
    );
    console.log('status :', status);
  });
});
