// // public/garden-service-worker.js
// // Service Worker for Garden initialization

// console.log('Garden Service Worker: Starting up...');

// self.addEventListener('install', (event) => {
//   console.log('Garden Service Worker: Installing...');
//   // Skip waiting to activate immediately
//   self.skipWaiting();
// });

// self.addEventListener('activate', (event) => {
//   console.log('Garden Service Worker: Activated and ready!');
//   // Claim all clients immediately
//   event.waitUntil(
//     self.clients.claim().then(() => {
//       console.log('Garden Service Worker: All clients claimed');
//     }),
//   );
// });

// self.addEventListener('message', (event) => {
//   console.log('Garden Service Worker: Received message:', event.data);

//   if (event.data && event.data.type === 'GARDEN_INITIALIZED') {
//     console.log('🌱 Garden Service Worker: Garden has been initialized!', {
//       timestamp: event.data.payload?.timestamp,
//       gardenId: event.data.payload?.gardenId,
//     });

//     // Notify all clients that Garden is ready
//     self.clients.matchAll().then((clients) => {
//       clients.forEach((client) => {
//         client.postMessage({
//           type: 'GARDEN_SERVICE_WORKER_READY',
//           message: 'Garden initialization processed by service worker',
//         });
//       });
//     });
//   }

//   // Send acknowledgment back
//   if (event.ports && event.ports[0]) {
//     event.ports[0].postMessage({
//       type: 'SERVICE_WORKER_RESPONSE',
//       message: 'Message received and processed',
//     });
//   }
// });

// // Handle fetch events (optional - for caching or network requests)
// self.addEventListener('fetch', (event) => {
//   // Only log garden-related requests to avoid spam
//   if (
//     event.request.url.includes('garden') ||
//     event.request.url.includes('swap')
//   ) {
//     console.log(
//       'Garden Service Worker: Intercepted request:',
//       event.request.url,
//     );
//   }

//   // Let the request pass through normally
//   // You can add caching logic here if needed
// });

// // Optional: Handle periodic background sync
// self.addEventListener('sync', (event) => {
//   if (event.tag === 'garden-background-sync') {
//     console.log('Garden Service Worker: Performing background sync...');
//     // Add your background sync logic here
//     event.waitUntil(performBackgroundSync());
//   }
// });

// async function performBackgroundSync() {
//   console.log('Garden Service Worker: Background sync completed');
//   // Add any background tasks here
// }

// console.log(
//   'Garden Service Worker: Setup complete! Ready to handle Garden events.',
// );
