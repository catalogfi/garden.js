import { WebSocketServer } from 'ws';
import * as http from 'http';

export const startWsServer = () => {
  const port = 8081;

  const httpServer = http.createServer().listen(port);

  const wss = new WebSocketServer({ server: httpServer });

  const orders = [
    {
      ID: 1,
    },
    {
      ID: 2,
    },
  ];

  let counter = 0;

  wss.on('connection', (ws) => {
    ws.on('message', () => {
      if (counter == 0) {
        //send error first
        ws.send(
          JSON.stringify({
            type: 'rest.WebsocketError',
          })
        );
      } else {
        //send all
        ws.send(
          JSON.stringify({
            type: 'rest.UpdatedOrders',
            msg: {
              orders,
            },
          })
        );
      }
      counter++;
    });
  });
};
