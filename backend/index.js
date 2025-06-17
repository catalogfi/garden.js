// server.js
const express = require('express');
const app = express();
const port = 3000;

// Serve the service worker file
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const SW_VERSION = '1.0.0';
    self.addEventListener('install', (event) => {
      console.log('[SW] Installing version', SW_VERSION);
      event.waitUntil(self.skipWaiting());
    });

    self.addEventListener('activate', (event) => {
      console.log('[SW] Activated');
      event.waitUntil(self.clients.claim());
    });

    self.addEventListener('message', (event) => {
      const { type, id } = event.data || {};
      if (type === 'PING') {
        const response = { type: 'PONG', data: { swVersion: SW_VERSION, timestamp: Date.now() }, id };
        if (event.ports?.[0]) event.ports[0].postMessage(response);
        else event.source?.postMessage(response);
      }
    });

    setInterval(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_HEARTBEAT', data: { timestamp: Date.now() } });
        });
      });
    }, 30000);
  `);
});

app.listen(port, () => {
  console.log(`Service Worker server running at http://localhost:${port}`);
});
