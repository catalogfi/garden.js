import { Fetcher as c, trim0x as S } from "@catalogfi/utils";
import { OrdersSocket as I } from "./index7.js";
import { Siwe as m } from "./index8.js";
import { parseURL as O } from "./index6.js";
import { orderPairGenerator as E } from "./index3.js";
import { OrderbookErrors as h } from "./index9.js";
import { StoreKeys as T } from "./index10.js";
import { MemoryStorage as p } from "./index11.js";
import { API as i } from "./index12.js";
class n {
  /**
   * Creates an instance of Orderbook. Does not login to the orderbook backend
   * @constructor
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   *
   */
  constructor(t) {
    var s;
    this.url = O(t.url ?? i), this.orderSocket = new I(this.url.replace("https", "wss")), this.url += this.url.endsWith("/") ? "" : "/", this.auth = new m(this.url, t.signer, {
      ...t.opts,
      store: ((s = t.opts) == null ? void 0 : s.store) || new p()
    });
  }
  /**
   * Initializes the orderbook as well as logs in the orderbook and stores the auth token in the store.
   *
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   */
  static async init(t) {
    var r;
    const e = await new m(
      t.url ?? i,
      t.signer,
      t.opts
    ).getToken();
    return t.opts = {
      ...t.opts,
      store: ((r = t == null ? void 0 : t.opts) == null ? void 0 : r.store) ?? new p()
    }, t.opts.store.setItem(T.AUTH_TOKEN, e), new n(t);
  }
  async createOrder(t) {
    const {
      sendAmount: s,
      secretHash: e,
      receiveAmount: r,
      fromAsset: a,
      toAsset: l,
      ...u
    } = t;
    this.validateConfig(t);
    const w = E(a, l), A = this.url + "orders", { orderId: N } = await c.post(A, {
      body: JSON.stringify({
        ...u,
        sendAmount: s,
        receiveAmount: r,
        secretHash: S(e),
        orderPair: w,
        userWalletBTCAddress: u.btcInputAddress
      }),
      headers: {
        Authorization: await this.auth.getToken()
      }
    });
    return N;
  }
  async getOrders(t, s) {
    const e = await c.get(
      this.url + "orders?" + new URLSearchParams({
        ...s != null && s.taker ? { taker: t } : { maker: t },
        verbose: s != null && s.verbose ? "true" : "false",
        ...s != null && s.pending ? { status: "2" } : {}
      })
    );
    return s != null && s.verbose, e;
  }
  subscribeOrders(t, s) {
    this.orderSocket.subscribe(t, s);
  }
  unsubscribeOrders() {
    this.orderSocket.unsubscribe();
  }
  validateConfig(t) {
    const { sendAmount: s, receiveAmount: e } = t, r = +s, a = +e;
    if (isNaN(r) || r <= 0 || s.includes("."))
      throw new Error(h.INVALID_SEND_AMOUNT);
    if (isNaN(a) || a <= 0 || e.includes("."))
      throw new Error(h.INVALID_RECEIVE_AMOUNT);
  }
}
export {
  n as Orderbook
};
