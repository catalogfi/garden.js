import { safeParseJson } from '@catalogfi/utils';
import { Order, Orders } from './orderbook.types';
import { WebSocket as NodeWS } from 'ws';

const socket =
  (typeof window !== 'undefined' && window.WebSocket) ||
  (typeof global !== 'undefined' && global.WebSocket) ||
  (typeof WebSocket !== 'undefined' && WebSocket) ||
  NodeWS;

const SocketResponseTypes = {
  OpenOrder: 'rest.OpenOrder',
  UpdatedOrders: 'rest.UpdatedOrders',
  UpdatedOrder: 'rest.UpdatedOrder',
  WebsocketError: 'rest.WebsocketError',
  Ping: 'ping',
} as const;

type SocketMsgOrders = {
  type: 'rest.UpdatedOrders';
  msg: {
    orders: Orders;
  };
};

type SocketMsgOrder = {
  type: 'rest.UpdatedOrder';
  msg: {
    order: Order;
  };
};

type SocketMsgOthers = {
  type: (typeof SocketResponseTypes)[keyof Omit<
    typeof SocketResponseTypes,
    'UpdatedOrders' | 'UpdatedOrder'
  >];
  msg: string;
};

type SocketMsg = SocketMsgOrders | SocketMsgOrder | SocketMsgOthers;

const retryCode = 3001;

export class OrdersSocket {
  private url: string;
  private socket: ISocket | undefined;
  constructor(url: string) {
    this.url = url;
  }
  subscribe(account: string, cb: (orders: Orders) => void) {
    this.socket = new Socket(this.url);
    this.socket.onMsg<SocketMsg>((ws, event) => {
      if (event.type === SocketResponseTypes.UpdatedOrders) {
        cb(event.msg.orders);
      } else if (event.type === SocketResponseTypes.UpdatedOrder) {
        cb([event.msg.order]);
      } else if (event.type === SocketResponseTypes.WebsocketError) {
        ws.close(retryCode);
      }
    });
    this.socket.send('subscribe::' + account);
    this.socket.onClose(() => {
      this.subscribe(account, cb);
    });
  }
  unsubscribe = () => this.socket?.close();
}

interface ISocket {
  onMsg<T>(cb: (ws: ISocket, data: T) => void): void;
  onClose(cb: (reason: string) => void): void;
  send(data: string): void;
  close(code?: number): void;
}

class Socket implements ISocket {
  private socket: WebSocket | NodeWS;
  private pingTimeout: NodeJS.Timeout | undefined;

  constructor(url: string) {
    this.socket = new socket(url);
  }

  onMsg<T>(cb: (ws: ISocket, data: T) => void): void {
    this.socket.onmessage = (event: { data: string }) => {
      if (this.pingTimeout) clearTimeout(this.pingTimeout);
      this.pingTimeout = setTimeout(() => {
        this.socket.close(retryCode);
      }, 30 * 1000);

      cb(this, safeParseJson(event.data));
    };
  }

  onClose(cb: (reason: string) => void): void {
    this.socket.onclose = (event: { code: number; reason: string }) => {
      if (event.code === retryCode) {
        cb(event.reason);
      }
    };
  }

  send(data: string): void {
    if (this.socket.readyState === socket.OPEN) {
      this.socket.send(data);
    } else {
      this.socket.onopen = () => {
        this.socket.send(data);
      };
    }
  }

  close(code?: number): void {
    clearTimeout(this.pingTimeout);
    this.socket.close(code);
  }
}
