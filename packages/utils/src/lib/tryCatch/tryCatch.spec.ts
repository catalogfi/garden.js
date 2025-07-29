import { expect, describe, it } from 'vitest';
import { Err, Ok } from '../result/result';
import { executeWithTryCatch } from './tryCatch';

describe.only('Should test executeWithTryCatch', () => {
  it('try catch wrapper', async () => {
    const asyncFunction = async () => {
      return Ok('test');
    };

    const result = await executeWithTryCatch(asyncFunction);
    expect(result.error).toBeUndefined();
    expect(result.val).toBe('test');

    const func = () => {
      return 'test';
    };
    const result2 = await executeWithTryCatch(func);
    expect(result2.error).toBeUndefined();
    expect(result2.val).toBe('test');

    const asyncFunction2 = async () => {
      return Err(new Error('error'));
    };

    const result3 = await executeWithTryCatch(asyncFunction2);
    expect(result3.error).toBeInstanceOf(Error);
  });
  it('try catch wrapper with error', async () => {
    const asyncFunction = async () => {
      throw new Error('error');
    };

    const result = await executeWithTryCatch(asyncFunction);
    expect(result.error).toBeTypeOf('string');
  });
});
