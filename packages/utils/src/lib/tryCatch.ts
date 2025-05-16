import { AsyncResult, Err, Ok } from './result';

/**
 * A wrapper function to execute a function with try catch block.
 * @param tryFunction The function to execute.
 */
export async function executeWithTryCatch<T>(
  tryFunction: () => T | Promise<T> | AsyncResult<T, string>,
  errorMessage: string = 'Failed to execute',
): AsyncResult<T, string> {
  try {
    const result = await tryFunction();
    if (typeof result == 'object' && result !== null && 'ok' in result) {
      return result;
    }
    return Ok(result);
  } catch (error) {
    return Err(errorMessage + ': ', error);
  }
}
