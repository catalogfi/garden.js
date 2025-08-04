import { MatchedOrder } from '@gardenfi/orderbook';
import {
  APIResponse,
  AsyncResult,
  Err,
  Fetcher,
  Network,
  Ok,
  Url,
} from '@gardenfi/utils';
import { ISuiHTLC } from '../suiHTLC.types';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { WebCryptoSigner } from '@mysten/signers/webcrypto';

export class SuiRelay implements ISuiHTLC {
  private url: Url;
  private client: SuiClient;
  private account: WebCryptoSigner;

  constructor(
    relayerUrl: string | Url,
    account: WebCryptoSigner,
    network: Network,
  ) {
    this.client = new SuiClient({ url: getFullnodeUrl(network) });
    this.url = relayerUrl instanceof Url ? relayerUrl : new Url(relayerUrl);
    this.account = account;
  }

  get htlcActorAddress(): string {
    return this.account.getPublicKey().toSuiAddress();
  }

  async initiate(order: MatchedOrder): AsyncResult<string, string> {
    return Ok('done');
  }

  async redeem(
    order: MatchedOrder,
    secret: string,
  ): AsyncResult<string, string> {
    try {
      const res = await Fetcher.post<APIResponse<string>>(
        this.url.endpoint('redeem'),
        {
          body: JSON.stringify({
            order_id: order.create_order.create_id,
            secret: secret,
            perform_on: 'Destination',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          retryCount: 10,
          retryDelay: 2000,
        },
      );

      if (res.error) return Err(res.error);
      return res.result ? Ok(res.result) : Err('Redeem: No result found');
    } catch (error) {
      return Err(String(error));
    }
  }

  async refund(): AsyncResult<string, string> {
    return Err('Refund is taken care of by the relayer');
  }
}
