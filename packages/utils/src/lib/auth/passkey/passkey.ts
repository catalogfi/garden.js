import { Err, Ok, Result } from '@catalogfi/utils';
import { AsyncResult } from '@catalogfi/utils';
import { AuthHeaderEnum, AuthHeader, IAuth } from '../auth.types';
import { parseJwt } from '../../utils';

export class Passkey implements IAuth {
  private token: string | undefined;

  constructor(token: string) {
    this.token = token;
  }

  async getToken(): AsyncResult<string, string> {
    if (!this.token) return Err('Token is not set');

    const verify = this.verifyToken(this.token);
    if (verify.ok) return Ok(this.token);

    return Err('Token is invalid');
  }

  verifyToken(token: string): Result<boolean, string> {
    try {
      const parsedToken = parseJwt<{
        user_id: string;
        exp: number;
      }>(token);
      if (!parsedToken) return Ok(false);
      const utcTimestampNow = Math.floor(Date.now() / 1000) + 120;
      return Ok(parsedToken.exp > utcTimestampNow);
    } catch {
      return Ok(false);
    }
  }

  async getAuthHeaders(): AsyncResult<AuthHeader, string> {
    const token = await this.getToken();
    if (token.ok) return Ok({ [AuthHeaderEnum.Authorization]: token.val });

    return Err(token.error ?? 'Failed to get auth token');
  }
}
