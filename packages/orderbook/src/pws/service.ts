import { JsonRpcApiProvider, JsonRpcSigner, Wallet } from 'ethers';
import {
  ConditionalPaymentFinalRequest,
  ConditionalPaymentInitialRequest,
  IPaymentChannelService as IPaymentChannelService,
  PaymentChannelState,
} from './interface';
import { AsyncResult, Err, Fetcher, Ok, Void } from '@catalogfi/utils';
import { Url } from '../url';
import { IAuth } from '../auth/auth.interface';
import {
  getProviderOrThrow,
  getTimelock,
  parseError,
  signPayment,
} from './utils';

export class PaymentChannelService implements IPaymentChannelService {
  private api: Url;
  private signer: JsonRpcSigner | Wallet;
  private provider: JsonRpcApiProvider;
  private auth: IAuth;

  private constructor(api: Url, signer: JsonRpcSigner | Wallet, auth: IAuth) {
    this.api = api;
    this.signer = signer;
    this.auth = auth;
    this.provider = getProviderOrThrow(signer);
  }

  static init(api: string, signer: JsonRpcSigner | Wallet, auth: IAuth) {
    return new PaymentChannelService(new Url(api), signer, auth);
  }

  /**
   * creates a new payment channel with the specified deposit amount
   */
  async createChannel(
    depositAmt = '0'
  ): AsyncResult<PaymentChannelState, string> {
    const token = await this._getAuthToken();
    try {
      const res = await Fetcher.post<{
        data: PaymentChannelState;
      }>(this.api.endpoint('create'), {
        body: JSON.stringify({
          amount: depositAmt,
        }),
        headers: {
          Authorization: token,
        },
      });
      return Ok(res.data);
    } catch (error) {
      return Err(
        'createChannel: failed to create channel: ' + parseError(error)
      );
    }
  }

  /**
   * gets the latest state of the payment channel associated with the address
   *
   * Note: Currently only returns the first channel
   */
  async getChannel(): AsyncResult<PaymentChannelState, string> {
    try {
      const address = await this.signer.getAddress();
      const res = await Fetcher.get<{ data: PaymentChannelState[] }>(
        this.api.endpoint('/channels/' + address)
      );
      if (res.data.length === 0) return Err('No channel found');
      return Ok(res.data[0]);
    } catch (error) {
      // failed to get channel state
      return Err(
        'getChannelState: failed to get channel: ' + parseError(error)
      );
    }
  }

  private _getAuthToken = async () => {
    const token = await this.auth.getToken();
    if (!token) throw new Error('Token not found');
    return token;
  };

  private async getSignatureForConditionalPayment(
    paymentRequest: ConditionalPaymentInitialRequest
  ): AsyncResult<{ userSig: string; channelId: number }, string> {
    const state = await this.getChannel();
    if (state.error)
      return Err('getSignatureForConditionalPayment:', state.error);
    const channel = state.val;

    const signature = await signPayment(channel, paymentRequest, this.signer);

    return Ok({ userSig: signature, channelId: channel.ID });
  }

  private async _lockChannel(id: number) {
    const token = await this._getAuthToken();
    try {
      await Fetcher.post(this.api.endpoint('lock'), {
        headers: {
          Authorization: token,
        },
        body: JSON.stringify({
          channelId: id,
        }),
      });
      return Ok(Void);
    } catch (error) {
      // failed to lock channel
      return Err('lockChannel:', 'failed to lock channel:', parseError(error));
    }
  }

  async payConditionally(
    request: Omit<ConditionalPaymentInitialRequest, 'timeLock'>
  ): AsyncResult<void, string> {
    const paymentRequestRes = await this.createConditionalPayment(request);
    if (paymentRequestRes.error)
      return Err('payConditionally:', paymentRequestRes.error);

    const paymentRequest = paymentRequestRes.val;
    const res = await this._lockChannel(paymentRequest.channelId);
    if (res.error) return Err(res.error);

    const token = await this._getAuthToken();
    try {
      await Fetcher.post(this.api.endpoint('htlc'), {
        body: JSON.stringify({
          ...paymentRequest,
          htlc: {
            ...paymentRequest.htlc,
            secretHash: paymentRequest.htlc.secretHash.slice(2),
          },
          userStateSignature: paymentRequest.userSig.slice(2),
        }),
        headers: {
          Authorization: token,
        },
      });
      return Ok(Void);
    } catch (error) {
      // failed to pay conditionally
      return Err('payConditionally:', parseError(error));
    }
  }

  /**
   * Constructs a conditional payment request for backend to accept.
   *
   * Use .payConditionally() to actually pay conditionally.
   */
  async createConditionalPayment(
    paymentRequest: Omit<ConditionalPaymentInitialRequest, 'timeLock'>
  ): AsyncResult<ConditionalPaymentFinalRequest, string> {
    const payment: {
      channelId: number;
      htlc: ConditionalPaymentInitialRequest;
      userSig: string;
    } = {
      channelId: 0,
      htlc: {
        ...paymentRequest,
        timeLock: 0,
      },
      userSig: '',
    };

    payment.htlc.timeLock = await getTimelock(this.provider);

    const res = await this.getSignatureForConditionalPayment(payment.htlc);
    if (res.error) return Err(res.error);

    payment.channelId = res.val.channelId;
    payment.userSig = res.val.userSig;

    // make sure payment is intactq
    if (
      !payment.channelId ||
      !payment.userSig ||
      !payment.htlc.timeLock ||
      !payment.htlc.secretHash ||
      !payment.htlc.sendAmount ||
      !payment.htlc.receiveAmount
    ) {
      return Err('createConditionalPayment: failed to create payment');
    }

    return Ok(payment);
  }
}
