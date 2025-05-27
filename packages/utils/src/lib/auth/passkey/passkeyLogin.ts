import { Url } from '../../url';
import {
  ConditionalLoginChallenge,
  PasskeyToken,
  RegisterChallenge,
} from './passkey.types';
import { APIResponse } from '../../apiResponse.types';
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { IStore } from '../../store';
import { AsyncResult, Err, Ok, Result } from '../../result';
import { Fetcher } from '../../fetcher';

export class PasskeyLogin {
  private url: Url;
  private store: IStore;
  private storeKey = 'passkey-auth';
  private token: string | undefined;
  private userName: string | undefined;

  constructor(url: Url, store: IStore) {
    if (!window) {
      throw new Error('Passkey is only supported in the browser environment.');
    }

    this.url = url.endpoint('passkey');
    this.store = store;
  }

  getPasskeyFromStore(): Result<PasskeyToken, string> {
    if (this.token && this.userName)
      return Ok({ token: this.token, gardenUserName: this.userName });

    const passkey = this.store.getItem(this.storeKey);
    if (passkey) {
      const token: PasskeyToken = JSON.parse(passkey);
      return Ok(token);
    }
    return Err('Passkey is not set');
  }

  /**
   * Validates the username according to predefined rules.
   * @param username The username to validate.
   * @returns Result<string, string> - Ok if valid, Err with message if invalid.
   */
  private validateUsername(username: string): Result<string, string> {
    //TODO: add more validation rules
    if (!username || username.length === 0)
      return Err('Username cannot be empty');
    if (username.length < 3 || username.length > 32)
      return Err('Username must be between 3 and 32 characters');
    if (username.includes(' ')) return Err('Username cannot contain spaces');
    return Ok(username.trim().toLowerCase());
  }

  /**
   * Handles user registration using WebAuthn passkeys.
   * @param username The username to register.
   * @returns AsyncResult<PasskeyToken, string> - Ok if successful, Err if failed.
   */
  async register(username: string): AsyncResult<PasskeyToken, string> {
    const _username = this.validateUsername(username);
    if (_username.error) return Err(_username.error);

    try {
      const challengeResponse = await Fetcher.post<
        APIResponse<RegisterChallenge>
      >(this.url.endpoint('register/begin'), {
        body: JSON.stringify({ username: _username }),
        headers: { credentials: 'include', 'Content-Type': 'application/json' },
      });
      if (challengeResponse.error)
        return Err('Failed to start registration', challengeResponse.error);

      const challenge = challengeResponse.result?.challenge;
      if (!challenge) return Err('No challenge found');
      if (!challenge.publicKey.authenticatorSelection)
        return Err('No authenticator selection found');

      challenge.publicKey.authenticatorSelection.requireResidentKey = true;
      challenge.publicKey.authenticatorSelection.residentKey = 'required';

      const registrationResponse = await startRegistration({
        optionsJSON: challenge.publicKey,
      });

      const verificationResp = await Fetcher.post<APIResponse<PasskeyToken>>(
        this.url.endpoint('register/finish'),
        {
          body: JSON.stringify({
            username: _username,
            credential: registrationResponse,
          }),
          headers: {
            credentials: 'include',
            'Content-Type': 'application/json',
          },
        },
      );

      if (verificationResp.error)
        return Err('Failed to verify registration: ' + verificationResp.error);
      if (!verificationResp.result) return Err('No verification result found');

      this.token = verificationResp.result.token;
      this.userName = _username.val;
      return Ok(verificationResp.result);
    } catch (error) {
      return Err('Registration error', error as string);
    }
  }

  /**
   * Handles user login using WebAuthn passkeys.
   * @param username The username to log in.
   * @returns AsyncResult<PasskeyToken, string> - Ok if successful, Err if failed.
   */
  async login(username: string): AsyncResult<PasskeyToken, string> {
    const _username = this.validateUsername(username);
    if (_username.error) return Err(_username.error);

    try {
      const challengeResponse = await Fetcher.post<
        APIResponse<RegisterChallenge>
      >(this.url.endpoint('login/begin'), {
        body: JSON.stringify({ username: _username }),
        headers: { credentials: 'include', 'Content-Type': 'application/json' },
      });
      if (challengeResponse.error)
        return Err('Failed to start login', challengeResponse.error);
      const challenge = challengeResponse.result?.challenge;
      if (!challenge) return Err('No challenge found');

      const authenticationResponse = await startAuthentication({
        optionsJSON: challenge.publicKey,
      });

      const verificationResp = await Fetcher.post<APIResponse<PasskeyToken>>(
        this.url.endpoint('login/finish'),
        {
          body: JSON.stringify({
            username: _username,
            credential: authenticationResponse,
          }),
          headers: {
            credentials: 'include',
            'Content-Type': 'application/json',
          },
        },
      );

      if (verificationResp.error)
        return Err('Failed to verify login', verificationResp.error);
      if (!verificationResp.result) return Err('No verification result found');

      this.token = verificationResp.result.token;
      this.userName = _username.val;
      return Ok(verificationResp.result);
    } catch (error) {
      return Err('Login error', error as string);
    }
  }

  /**
   * Handles conditional login (without username) for existing users.
   * @returns AsyncResult<PasskeyToken, string> - Ok if successful, Err if failed.
   */
  async conditionalLogin(): AsyncResult<PasskeyToken, string> {
    try {
      const challengeResponse = await Fetcher.get<
        APIResponse<ConditionalLoginChallenge>
      >(this.url.endpoint('conditional-login/begin'), {
        headers: { credentials: 'include' },
      });
      if (challengeResponse.error)
        return Err('Failed to start login', challengeResponse.error);
      const challenge = challengeResponse.result?.challenge;
      if (!challenge) return Err('No challenge found');

      const authenticationResponse = await startAuthentication({
        optionsJSON: challenge.publicKey,
      });

      const verificationResp = await Fetcher.post<APIResponse<PasskeyToken>>(
        this.url.endpoint('conditional-login/finish'),
        {
          body: JSON.stringify({
            login_id: challengeResponse.result?.login_id,
            credential: authenticationResponse,
          }),
          headers: {
            credentials: 'include',
            'Content-Type': 'application/json',
          },
        },
      );

      if (verificationResp.error)
        return Err('Failed to verify login', verificationResp.error);
      if (!verificationResp.result) return Err('No verification result found');

      this.token = verificationResp.result.token;
      this.userName = verificationResp.result.gardenUserName;
      return Ok(verificationResp.result);
    } catch (error) {
      return Err('Conditional login error', error as string);
    }
  }
}
