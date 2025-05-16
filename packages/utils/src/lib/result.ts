export type Ok<T> = { ok: true; val: T; error?: undefined };
export type Err<E> = { ok: false; val?: undefined; error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const Ok = <T>(val: T): Ok<T> => ({ ok: true, val });

export type AsyncResult<T, E> = Promise<Result<T, E>>;

export const Void = undefined;

/**
 * Constructs an error result with the given error value.
 *
 * If the error value is a string, it can be followed by any number of optional messages which will be concatenated
 */
export const Err = <E>(
  error: E,
  ...optionalMsg: (E extends string ? any : never)[]
): Err<E> => {
  let finalError = error;

  if (typeof error === 'string' && optionalMsg && optionalMsg.length > 0) {
    const msg = [error, ...optionalMsg].map((m: any) => {
      if (m) {
        if (m instanceof Error) {
          return m.message;
        } else if (typeof m === 'string') {
          return m;
        } else if (m?.toString) {
          return m.toString();
        }
      }
      return undefined;
    });
    finalError = msg.filter((m) => m !== undefined).join(' ') as E;
  }

  return {
    ok: false,
    val: undefined,
    error: finalError,
  };
};
