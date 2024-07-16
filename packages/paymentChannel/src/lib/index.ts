import { JsonRpcSigner, Wallet } from 'ethers';
import { AsyncResult } from '@catalogfi/utils';
import { IPaymentChannel, PaymentChannelState } from './paymentChannel.types';
import { Url } from 'url';
export class PaymentChannel implements IPaymentChannel {
  private api: Url;
  private signer: JsonRpcSigner | Wallet;
  private provider: JsonRpcApiProvider;
  private auth: IAuth;
  /**
   * gets the latest state of the payment channel associated with the address
   *
   * Note: Currently only returns the first channel
   */
  async getChannel() {
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
}
