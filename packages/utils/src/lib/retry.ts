// a class that retries a function until it succeeds or the max number of retries is reached

import { sleep } from './utils';

export class Retry {
  private maxRetries: number;
  private delay: number;

  /**
   * @param {number} maxRetries - The maximum number of retries, if less < 0 then it is set to 0
   * @param {number} delay - The delay between retries
   */
  constructor(maxRetries: number, delay: number) {
    this.maxRetries = Math.max(maxRetries, 0);
    this.delay = delay;
  }

  /**
   * Retries a function until it succeeds or the max number of retries is reached
   *
   * @param {() => Promise<T>} fn - The function to retry
   * @return {Promise<T>} a Promise that resolves to the result of the function
   */
  async retry<T>(fn: () => Promise<T>): Promise<T> {
    let retries = 0;
    let error: unknown;
    while (retries < this.maxRetries + 1) {
      try {
        return await fn();
      } catch (e) {
        retries++;
        error = e;
        await sleep(this.delay * retries);
      }
    }
    throw error;
  }
}
