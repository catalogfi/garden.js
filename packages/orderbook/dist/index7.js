import { safeParseJson as n } from "@catalogfi/utils";
import { WebSocket as k } from "ws";
const i = typeof window < "u" && window.WebSocket || typeof global < "u" && global.WebSocket || typeof WebSocket < "u" && WebSocket || k, o = {
  OpenOrder: "rest.OpenOrder",
  UpdatedOrders: "rest.UpdatedOrders",
  UpdatedOrder: "rest.UpdatedOrder",
  WebsocketError: "rest.WebsocketError",
  Ping: "ping"
}, r = 3001;
class a {
  constructor(e) {
    this.unsubscribe = () => {
      var s;
      return (s = this.socket) == null ? void 0 : s.close();
    }, this.url = e;
  }
  subscribe(e, s) {
    this.socket = new p(this.url), this.socket.onMsg((d, t) => {
      t.type === o.UpdatedOrders ? s(t.msg.orders) : t.type === o.UpdatedOrder ? s([t.msg.order]) : t.type === o.WebsocketError && d.close(r);
    }), this.socket.send("subscribe::" + e), this.socket.onClose(() => {
      this.subscribe(e, s);
    });
  }
}
class p {
  constructor(e) {
    this.socket = new i(e);
  }
  onMsg(e) {
    this.socket.onmessage = (s) => {
      this.pingTimeout && clearTimeout(this.pingTimeout), this.pingTimeout = setTimeout(() => {
        this.socket.close(r);
      }, 65e3), e(this, n(s.data));
    };
  }
  onClose(e) {
    this.socket.onclose = (s) => {
      s.code === r && e(s.reason);
    };
  }
  send(e) {
    this.socket.readyState === i.OPEN ? this.socket.send(e) : this.socket.onopen = () => {
      this.socket.send(e);
    };
  }
  close(e) {
    clearTimeout(this.pingTimeout), this.socket.close(e);
  }
}
export {
  a as OrdersSocket
};
