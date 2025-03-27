export class Result<T, E> {
  #ok: boolean;
  #val: T;
  #error: E | undefined;

  constructor(ok: boolean, val: T, error: E | undefined = undefined) {
    this.#ok = ok;
    this.#error = error;
    this.#val = val;
  }

  get ok() {
    return this.#ok;
  }

  get error() {
    return this.#error;
  }

  get val() {
    return this.#val;
  }
}

export type AsyncResult<T, E> = Promise<Result<T, E>>;

export const Ok = <T>(val: T) => new Result<T, never>(true, val);

export const Void = undefined;

/**
 * Constructs an error result with the given error value.
 *
 * If the error value is a string, it can be followed by any number of optional messages which will be concatenated
 */
export const Err = <E>(
  error: E,
  ...optionalMsg: (E extends string ? any : never)[]
) => {
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
    return new Result<never, E>(
      false,
      null as never,
      msg.filter((m) => m !== undefined).join(' ') as E,
    );
  }

  return new Result<never, E>(false, null as never, error);
};
