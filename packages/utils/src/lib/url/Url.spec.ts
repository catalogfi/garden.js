import { describe, expect, it, test } from 'vitest';
import { Url } from './Url';

describe('url', async () => {
  test('should create a url', async () => {
    const url = new Url('/orders', 'http://localhost:4426');
    const newURL = url.endpoint('/id/matched');
    expect(url.pathname).toEqual('/orders');
    expect(newURL.pathname).toEqual('/orders/id/matched');
  });

  it('test', () => {
    const url = new Url('https://api.hashira.io/orderbook').endpoint(
      '/relayer',
    );
    const newURL = url.endpoint('/id/matched');
    console.log('newURL :', newURL.toString());
    // expect(url.pathname).toEqual('/orders');
    // expect(newURL.pathname).toEqual('/orders/id/matched');
  });

  it('test', () => {
    const url = new Url('https://api.hashira.io/quote').endpoint('/');
    const newURL = url.endpoint('/id/matched');
    console.log('newURL :', newURL.toString());
  });
});
