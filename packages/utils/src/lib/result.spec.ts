import { describe, it } from 'vitest';
import { Err, Ok } from './result';

describe('Result', () => {
  const helper = (res: boolean) => {
    if (res) {
      return Ok('test');
    }
    return Err('test');
  };

  const helper2 = (res: string) => {
    console.log('res :', res);
  };

  it('should create a result', () => {
    const result = helper(true);
    if (!result.ok) {
      helper2(result.error);
      return;
    }
    helper2(result.val);
  });
});
