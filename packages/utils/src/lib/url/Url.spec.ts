import { describe, expect, test } from 'vitest';
import { Url } from './Url';

describe('url', async () => {
  test('should create a url', async () => {
    const url = new Url('/orders', 'http://localhost:4426');
    const newURL = url.endpoint('/id/matched');
    expect(url.pathname).toEqual('/orders');
    expect(newURL.pathname).toEqual('/orders/id/matched');
  });
});
