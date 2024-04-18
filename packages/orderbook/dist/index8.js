import { SiweMessage as h } from "siwe";
import { Fetcher as a } from "@catalogfi/utils";
import { StoreKeys as o } from "./index10.js";
import { MemoryStorage as m } from "./index11.js";
import { parseURL as c } from "./index6.js";
import { API as d } from "./index12.js";
class v {
  constructor(e, i, t) {
    this.signingStatement = "I'm signing in to Catalog", this.url = c(e ?? d), this.signer = i, this.domain = (t == null ? void 0 : t.domain) || "catalog.fi", this.domain.startsWith("https://") && (this.domain = this.domain.split("https://")[1]), this.store = (t == null ? void 0 : t.store) ?? new m();
  }
  verifyToken(e, i) {
    const t = f(e);
    if (!t)
      return !1;
    try {
      const r = Math.floor(Date.now() / 1e3) + 120;
      return t.exp > r && t.userWallet.toLowerCase() === i.toLowerCase();
    } catch {
      return !1;
    }
  }
  async getToken() {
    const e = this.store.getItem(o.AUTH_TOKEN);
    if (e && this.verifyToken(e, this.signer.address))
      return e;
    const { message: i, signature: t } = await this.signStatement(), { token: r } = await a.post(
      this.url + "verify",
      {
        body: JSON.stringify({
          message: i,
          signature: t
        })
      }
    );
    if (!this.verifyToken(r, await this.signer.getAddress()))
      throw new Error("Token verification failed");
    return this.store.setItem(o.AUTH_TOKEN, r), r;
  }
  async signStatement() {
    if (!this.signer.provider)
      throw new Error("signer does not have a provider");
    const e = /* @__PURE__ */ new Date(), i = new Date(e.getTime() + 300 * 1e3), { nonce: t } = await a.get(this.url + "nonce"), r = await this.signer.provider.getNetwork(), n = new h({
      domain: this.domain,
      address: await this.signer.getAddress(),
      statement: this.signingStatement,
      nonce: t,
      uri: "https://" + this.domain,
      version: "1",
      chainId: +r.chainId.toString(),
      expirationTime: i.toISOString()
    }).prepareMessage(), g = await this.signer.signMessage(n);
    return {
      message: n,
      signature: g
    };
  }
}
const f = (s) => {
  try {
    if (s.split(".").length < 3)
      return;
    const e = s.split(".")[1];
    return e ? JSON.parse(Buffer.from(e, "base64").toString("latin1")) : void 0;
  } catch {
    return;
  }
};
export {
  v as Siwe
};
