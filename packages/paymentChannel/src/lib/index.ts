import {
  JsonRpcSigner,
  Wallet,
  JsonRpcApiProvider,
  sha256,
  TypedDataField,
  ethers,
  Contract,
} from 'ethers';
import {
  AsyncResult,
  Err,
  executeWithTryCatch,
  Fetcher,
  Ok,
} from '@catalogfi/utils';
import {
  ConditionalPaymentFinalRequest,
  ConditionalPaymentInitialRequest,
  IPaymentChannel,
  Channel,
  WithdrawNonce,
  HTLCStatus,
  WithdrawHTLC,
} from './paymentChannel.types';
import { IAuth, Url } from '@gardenfi/utils';
import {
  getL1BlockNumber,
  getProviderOrThrow,
  getTimelock,
  hashString,
  isDurationExceeded,
  parseError,
  signPayment,
} from './utils';
import {
  AtomicSwapConfig,
  ETH_BLOCKS_PER_DAY,
  SupportedChains,
  VERSION,
} from './constants';
import { AtomicSwapABI } from './abi/atomicSwap';

export class PaymentChannel implements IPaymentChannel {
  private api: Url;
  private signer: JsonRpcSigner | Wallet;
  private provider: JsonRpcApiProvider;
  private auth: IAuth;

  private constructor(
    api: Url,
    signer: JsonRpcSigner | Wallet,
    provider: JsonRpcApiProvider,
    auth: IAuth
  ) {
    this.api = api;
    this.signer = signer;
    this.auth = auth;
    this.provider = provider;
  }

  static init(api: string, signer: JsonRpcSigner | Wallet, auth: IAuth) {
    const provider = getProviderOrThrow(signer);
    if (provider.error) throw new Error(provider.error);
    return new PaymentChannel(new Url(api), signer, provider.val, auth);
  }

  /**
   * gets the latest state of the payment channel associated with the address
   *
   * Note: Currently only returns the first channel
   */
  async getChannel(): AsyncResult<Channel, string> {
    try {
      const address = await this.signer.getAddress();
      const res = await Fetcher.get<{ data: Channel[] }>(
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

  /**
   * Gets the signature for the conditional payment
   * @param {ConditionalPaymentInitialRequest} paymentRequest
   * @returns {AsyncResult<{ userSig: string; channelId: number }, string>}
   */
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

  /**
   * Constructs a conditional payment and sends request to backend.
   *
   * Use .payConditionally() to actually pay conditionally.
   */
  async createConditionalPayment(
    paymentRequest: Omit<ConditionalPaymentInitialRequest, 'timeLock'>
  ): AsyncResult<ConditionalPaymentFinalRequest, string> {
    let payment: {
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

    // make sure payment is intact
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

  private _getAuthToken = async () => {
    const token = await this.auth.getToken();
    if (!token) Err(new Error('Token not found'));
    return Ok(token);
  };

  /**
   * Locks the channel
   * @param id channel id
   * @returns void
   */
  async _lockChannel(id: number) {
    const token = await this._getAuthToken();
    if (token.error) return Err(token.error);

    return executeWithTryCatch(async () => {
      const res = await Fetcher.post<{
        data: Channel;
      }>(this.api.endpoint('/lock'), {
        headers: {
          Authorization: token.val,
        },
        body: JSON.stringify({
          channelId: id,
        }),
      });
      return res.data;
    }, 'lockChannel: failed to lock channel:');
  }

  /**
   * Creates a conditional htlc payment request, signs it and sends it to the backend
   * @param {ConditionalPaymentInitialRequest} request
   * @returns void
   */
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
    if (token.error) return Err(token.error);

    return await executeWithTryCatch(
      async () =>
        await Fetcher.post<void>(this.api.endpoint('htlc'), {
          body: JSON.stringify({
            ...paymentRequest,
            htlc: {
              ...paymentRequest.htlc,
              secretHash: paymentRequest.htlc.secretHash.slice(2),
            },
            userStateSignature: paymentRequest.userSig.slice(2),
          }),
          headers: {
            Authorization: token.val,
          },
        }),
      'payConditionally: failed to pay conditionally'
    );
  }

  async getWithdrawNonce(
    channelID: number
  ): AsyncResult<WithdrawNonce, string> {
    return executeWithTryCatch(async () => {
      const res = await Fetcher.get<{
        data: WithdrawNonce;
      }>(this.api.endpoint('/withdrawNonce?channelId=' + channelID), {
        retryCount: 3,
        retryDelay: 1000,
      });
      return res.data;
    }, 'getWithdrawNonce: failed to get withdraw nonce:');
  }

  async computeSecretsForWithdrawal(nonce: number) {
    const network = await this.provider.getNetwork();
    const selectedChainId = Number(network.chainId);
    if (SupportedChains.indexOf(selectedChainId) === -1)
      return Err('computeSecretsForWithdrawal: Invalid network');

    const types = {
      Data: [
        { name: 'Message', type: 'string' },
        { name: 'Version', type: 'string' },
        { name: 'Nonce', type: 'uint256' },
      ],
    };

    // Important: This message is used for managing accounts pertaining to a
    // given swap. This means any claim attempt must use the same data as an
    // order creation. It *should not* be modified without careful consideration.
    const message = {
      Message: 'Initialize withdrawal',
      Version: VERSION,
      Nonce: nonce,
    };
    const domain = {
      name: 'GARDEN FINANCE x STAKING',
      version: VERSION,
      chainId: selectedChainId,
    };

    const signature = await executeWithTryCatch(
      async () => await this.signer.signTypedData(domain, types, message),
      'computeSecretsForWithdrawal: failed to sign message'
    );
    if (signature.error) return Err(signature.error);

    const secret = hashString(signature.val);
    const secretHash = sha256(`0x${secret}`);

    return Ok({
      secret,
      secretHash,
    });
  }

  async signWithdrawMessage(
    channel: Channel,
    withdrawalAmount: BigInt,
    secretHash: string,
    currentETHBlocknumber: number
  ) {
    const network = await this.provider.getNetwork();
    const selectedChainId = Number(network.chainId);
    if (SupportedChains.indexOf(selectedChainId) === -1)
      return Err('signWithdrawMessage: Invalid network');

    const types: Record<string, TypedDataField[]> = {
      Claim: [
        { name: 'nonce', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'htlcs', type: 'HTLC[]' },
      ],
      HTLC: [
        { name: 'secretHash', type: 'bytes32' },
        { name: 'timeLock', type: 'uint256' },
        { name: 'sendAmount', type: 'uint256' },
        { name: 'receiveAmount', type: 'uint256' },
      ],
    };

    const domain = {
      name: 'FEEAccount',
      version: VERSION,
      chainId: selectedChainId,
      verifyingContract: channel.address,
    };

    const withdrawHTLC: WithdrawHTLC = {
      secretHash,
      timeLock: 2 * ETH_BLOCKS_PER_DAY + currentETHBlocknumber,
      sendAmount: '0',
      receiveAmount: withdrawalAmount.toString(),
    };

    //increase nonce to sign new state
    const WITHDRAWAL_STATE = {
      nonce: channel.latestState.nonce + 1,
      amount: channel.latestState.amount,
      htlcs: [
        ...channel.latestState.htlcs.map(
          ({ secretHash, timeLock, sendAmount, receiveAmount }) => ({
            secretHash: `0x${secretHash}`,
            timeLock,
            sendAmount,
            receiveAmount,
          })
        ),
        withdrawHTLC,
      ],
    };

    const signature = await executeWithTryCatch(
      async () =>
        await this.signer.signTypedData(domain, types, WITHDRAWAL_STATE)
    );
    if (signature.error) return Err(signature.error);

    return Ok({ htlc: withdrawHTLC, signature: signature.val });
  }

  async requestWithdrawal(
    paymentChannelId: number,
    htlc: WithdrawHTLC,
    signature: string
  ): AsyncResult<Channel, string> {
    const token = await this._getAuthToken();
    if (token.error) return Err(token.error);

    return await executeWithTryCatch(async () => {
      const res = await Fetcher.post<{
        data: { channel: Channel };
      }>(this.api.endpoint('/withdraw'), {
        body: JSON.stringify({
          channelId: paymentChannelId,
          htlc: {
            ...htlc,
            secretHash: htlc.secretHash.substring(2),
          },
          userStateSignature: signature.substring(2),
        }),
        headers: {
          Authorization: token.val,
        },
      });
      return res.data.channel;
    });
  }

  getAmountsFromChannel(channel: Channel) {
    const amountInChannel = BigInt(channel.latestState.amount);
    const lockedAmount = BigInt(channel.lockedAmount);
    const htlcPendingAmount = channel.latestState.htlcs.reduce((sum, htlc) => {
      //condition is to check all the payments from the user to feehub. (receive amount should be greater than 0 and send amount should be 0.)
      if (
        !(
          BigInt(htlc.receiveAmount) > 0 &&
          BigInt(htlc.sendAmount) === BigInt(0)
        )
      ) {
        return sum;
      }
      //now check expiry
      if (htlc.timeLock < 0) {
        return sum;
      }
      //status check
      if (
        htlc.status === HTLCStatus.Expired ||
        htlc.status === HTLCStatus.RelayerRefunded ||
        htlc.status === HTLCStatus.Failed
      ) {
        console.log('return status check :');
        return sum;
      }

      return sum + BigInt(htlc.receiveAmount);
    }, BigInt(0));

    const withdrawableAmount =
      amountInChannel - lockedAmount - htlcPendingAmount;

    return {
      amountInChannel,
      lockedAmount,
      htlcPendingAmount,
      withdrawableAmount,
    };
  }
  /**
   * creates a payment to feehub and then posts it to %%/withdrawal%% endpoint.
   * %%/withdraw%% endpoint will trigger feehub to initiate funds into atomic swap contract with the provided secret hash.
   * @returns updated channel with the withdraw htlc
   */
  async initiateWithdraw(): AsyncResult<Channel, string> {
    const network = await this.provider.getNetwork();
    if (SupportedChains.indexOf(Number(network.chainId)) === -1)
      return Err('initiateWithdraw: Invalid network');

    const token = await this._getAuthToken();
    if (token.error) return Err(token.error);

    const paymentChannel = await this.getChannel();
    if (paymentChannel.error) return Err(paymentChannel.error);

    const withdraw = await this.getWithdrawNonce(paymentChannel.val.ID);
    if (withdraw.error) return Err(withdraw.error);

    if (!isDurationExceeded(withdraw.val.lastUsed, 0, 5))
      return Err('initiateWithdraw: 5 min duration not exceeded');

    const withdrawNonce = withdraw.val.nonce;

    const l1BlockNumber = await getL1BlockNumber(this.provider);
    if (l1BlockNumber.error) return Err(l1BlockNumber.error);

    const { amountInChannel, lockedAmount, htlcPendingAmount } =
      this.getAmountsFromChannel(paymentChannel.val);

    const withdrawableAmount =
      amountInChannel - lockedAmount - htlcPendingAmount;

    if (withdrawableAmount <= BigInt(0))
      return Err('initiateWithdraw: No withdrawable amount');

    const secrets = await this.computeSecretsForWithdrawal(withdrawNonce);
    if (secrets.error) return Err(secrets.error);

    const { secretHash } = secrets.val;

    const channel = await this._lockChannel(paymentChannel.val.ID);
    if (channel.error) return Err(channel.error);

    const withdrawSig = await this.signWithdrawMessage(
      paymentChannel.val,
      withdrawableAmount,
      secretHash,
      l1BlockNumber.val
    );
    if (withdrawSig.error) return Err(withdrawSig.error);

    const postWithdraw = await this.requestWithdrawal(
      paymentChannel.val.ID,
      withdrawSig.val.htlc,
      withdrawSig.val.signature
    );
    if (postWithdraw.error) return Err(postWithdraw.error);

    return Ok(postWithdraw.val);
  }

  /**
   * redeems rewards from atomic swap contract
   * @param channel payment channel
   * @returns txHash
   */
  async redeemRewards(channel: Channel): AsyncResult<string, string> {
    const chainId = Number((await this.provider.getNetwork()).chainId);
    if (SupportedChains.indexOf(chainId) === -1)
      return Err('initiateWithdraw: Invalid network');

    const pendingWithdraw = channel.latestState.htlcs.find(
      ({ status }) =>
        status === HTLCStatus.Ready || status === HTLCStatus.RelayerInitiated
    );
    if (!pendingWithdraw) return Err('No pending withdraw found');

    const secrets = await this.computeSecretsForWithdrawal(
      pendingWithdraw.withdrawNonce
    );
    if (secrets.error) return Err(secrets.error);

    const { secret } = secrets.val;

    const config = AtomicSwapConfig[chainId as keyof typeof AtomicSwapConfig];
    const ASContract = new Contract(
      config.GARDEN_HTLC_ADDR,
      AtomicSwapABI,
      this.signer
    );

    const encoder = new ethers.AbiCoder();
    const orderId = ethers.sha256(
      encoder.encode(
        ['bytes32', 'address'],
        [ethers.sha256(`0x${secret}`), config.FEE_HUB]
      )
    );

    return await executeWithTryCatch(async () => {
      const txHash = await ASContract['redeem'](orderId, `0x${secret}`);
      txHash.wait();
      return Ok(txHash.hash);
    }, 'redeemRewards: failed to redeem rewards');
  }
}
