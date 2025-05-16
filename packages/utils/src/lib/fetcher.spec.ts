import { describe, it, expect } from 'vitest';
import { Fetcher } from './fetcher';

describe.only('Should test Fetcher', () => {
  it('should fetch data successfully', async () => {
    const res = await Fetcher.get(
      'https://jsonplaceholder.typicode.com/todos/1',
    );
    expect(res).toMatchObject({ userId: 1 });
  });

  it(
    'should throw an error on invalid URL with default retry',
    async () => {
      await expect(
        async () =>
          await Fetcher.get('https://jsonplaceholder.typicde.com/todos/1'),
      ).rejects.toThrowError();
    },
    1000 * 100,
  );

  it(
    'should retry the specified number of times on failure',
    async () => {
      const then = Date.now();
      await expect(
        async () =>
          await Fetcher.get('https://jsonplaceholder.typicde.com/todos/1', {
            retryCount: 3,
            retryDelay: 1000,
          }),
      ).rejects.toThrowError();
      const now = Date.now();
      expect(now - then).toBeGreaterThanOrEqual(3000);
    },
    100 * 1000,
  );

  it('should call the function only once when retryCount is 0', async () => {
    await expect(
      async () =>
        await Fetcher.get('https://jsonplaceholder.typicde.com/todos/1', {
          retryCount: 0,
          retryDelay: 0,
        }),
    ).rejects.toThrowError('fetch failed');
  });
});
