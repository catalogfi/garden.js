// src/workers/serviceWorkerManager.ts
export interface ServiceWorkerMessage {
  type: string;
  data?: any;
  id?: string;
}

export interface ServiceWorkerResponse {
  type: string;
  data?: any;
  id?: string;
  error?: string;
}

export interface ServiceWorkerConfig {
  swPath?: string;
  swFileName?: string;
  publicDir?: string;
  scope?: string;
  autoGenerate?: boolean;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();
  private messageId = 0;
  private pendingMessages = new Map<
    string,
    { resolve: (value: any) => void; reject: (error: any) => void }
  >();
  private config: ServiceWorkerConfig;

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      swPath: '/sw.js',
      swFileName: 'sw.js',
      publicDir: 'public',
      scope: '/',
      autoGenerate: true,
      ...config,
    };
  }

  private getServiceWorkerScript(): string {
    return `
      const SW_VERSION = '1.0.0';
      let messageHandlers = new Map();
      
      // Enhanced install handler
      self.addEventListener('install', (event) => {
        console.log('[SW] Installing version', SW_VERSION);
        event.waitUntil(
          caches.open('garden-v1').then(cache => {
            return cache.addAll([]); // Add any core assets to cache
          }).then(() => self.skipWaiting())
        );
      });

      // Enhanced activate handler
      self.addEventListener('activate', (event) => {
        console.log('[SW] Activating');
        event.waitUntil(
          Promise.all([
            self.clients.claim(),
            // Clean up old caches
            caches.keys().then(cacheNames => {
              return Promise.all(
                cacheNames.filter(name => name !== 'garden-v1')
                  .map(name => caches.delete(name))
              );
            })
          ]).then(() => {
            // Notify all clients
            return self.clients.matchAll()
              .then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    type: 'SW_READY',
                    data: { version: SW_VERSION }
                  });
                });
              });
          })
        );
      });

      // Enhanced message handler
      self.addEventListener('message', (event) => {
        const { type, data, id } = event.data;
        console.log('[SW] Received message:', type);
        
        try {
          // Immediate response for ping
          if (type === 'PING') {
            return respondToMessage(event, 'PONG', { 
              timestamp: Date.now(),
              swVersion: SW_VERSION
            });
          }

          // Handle other message types
          const handler = messageHandlers.get(type);
          if (handler) {
            return handler(event);
          }

          respondToMessage(event, 'UNKNOWN_MESSAGE', null, 'Unknown message type');
        } catch (error) {
          console.error('[SW] Error handling message:', error);
          respondToMessage(event, 'ERROR', null, error.message);
        }
      });

      function respondToMessage(event, type, data, error = null) {
        const response = {
          type,
          data,
          id: event.data.id,
          error
        };
        
        try {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage(response);
          } else if (event.source) {
            event.source.postMessage(response);
          } else {
            console.warn('[SW] No available message channel to respond');
          }
        } catch (e) {
          console.error('[SW] Failed to post message:', e);
        }
      }

      // Heartbeat to keep SW alive
      function sendHeartbeat() {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_HEARTBEAT',
              data: { timestamp: Date.now() }
            });
          });
        });
      }

      // Periodic heartbeat every 30s
      setInterval(sendHeartbeat, 30000);
    `;
  }

  public async initialize(): Promise<ServiceWorkerRegistration> {
    if (this.registration) return this.registration;

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this browser');
    }

    try {
      console.log('[SW Manager] Initializing service worker...');
      this.setupMessageListener();

      const existingRegistration =
        await navigator.serviceWorker.getRegistration();
      if (existingRegistration?.active) {
        console.log('[SW Manager] Found existing active registration');
        this.registration = existingRegistration;
        return existingRegistration;
      }

      // Replace this block:
      // const swScript = this.getServiceWorkerScript();
      // const blob = new Blob([swScript], { type: 'application/javascript' });
      // const blobUrl = URL.createObjectURL(blob);

      // With this:
      const swUrl = this.config.swPath ?? '/sw.js';

      console.log(
        `[SW Manager] Registering service worker from remote: ${swUrl}`,
      );
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: this.config.scope,
      });

      console.log('[SW Manager] Waiting for service worker activation');
      await this.waitForServiceWorkerActive(registration);

      await this.verifyServiceWorkerReady();

      this.registration = registration;
      console.log('[SW Manager] Service worker registered and ready');
      return registration;
    } catch (error) {
      console.error('[SW Manager] Initialization failed:', error);
      throw error;
    }
  }

  private async verifyServiceWorkerReady(): Promise<void> {
    // Wait for SW_READY message or timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Service worker readiness timeout'));
      }, 10000); // 10 second timeout

      this.onMessage('SW_READY', () => {
        clearTimeout(timeout);
        resolve();
      });

      // Also listen for errors
      this.onMessage('SW_ERROR', (error) => {
        clearTimeout(timeout);
        reject(new Error(error));
      });
    });
  }

  private async waitForServiceWorkerActive(
    registration: ServiceWorkerRegistration,
  ): Promise<void> {
    if (registration.active) {
      console.log('[SW Manager] Service worker already active');
      return;
    }

    const worker = registration.installing || registration.waiting;
    if (!worker) {
      console.log('[SW Manager] No installing/waiting worker found');
      return;
    }

    console.log(`[SW Manager] Waiting for worker (state: ${worker.state})`);
    return new Promise((resolve) => {
      const stateChangeHandler = () => {
        console.log(`[SW Manager] Worker state changed to: ${worker.state}`);
        if (worker.state === 'activated') {
          worker.removeEventListener('statechange', stateChangeHandler);
          resolve();
        }
      };
      worker.addEventListener('statechange', stateChangeHandler);
    });
  }

  private setupMessageListener(): void {
    console.log('[SW Manager] Setting up message listener');
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data, id, error } = event.data as ServiceWorkerResponse;
      console.log(`[SW Manager] Received message from SW: ${type}`, data);

      if (id && this.pendingMessages.has(id)) {
        const { resolve, reject } = this.pendingMessages.get(id)!;
        this.pendingMessages.delete(id);
        error ? reject(new Error(error)) : resolve(data);
        return;
      }

      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(data);
      } else {
        console.warn(`[SW Manager] No handler for message type: ${type}`);
      }
    });
  }

  public async sendMessage<T = any>(
    type: string,
    data?: any,
    expectResponse = true,
    timeoutMs = 15000,
  ): Promise<T> {
    if (!this.registration?.active) {
      throw new Error('Service Worker not active');
    }

    const id = expectResponse
      ? `msg_${++this.messageId}_${Date.now()}`
      : undefined;
    const message: ServiceWorkerMessage = { type, data, id };

    console.log(`[SW Manager] Sending message to SW: ${type}`, { id, data });

    if (!expectResponse || !id) {
      this.registration.active.postMessage(message);
      return Promise.resolve(undefined as T);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(id);
        console.error(`[SW Manager] Timeout waiting for response to ${type}`);
        reject(new Error(`Service Worker message timeout for ${type}`));
      }, timeoutMs);

      this.pendingMessages.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          console.log(`[SW Manager] Received response for ${type}:`, value);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          console.error(`[SW Manager] Error response for ${type}:`, error);
          reject(error);
        },
      });

      try {
        this.registration!.active!.postMessage(message);
      } catch (error) {
        this.pendingMessages.delete(id);
        clearTimeout(timeout);
        console.error('[SW Manager] Failed to post message:', error);
        reject(error);
      }
    });
  }

  public onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  public offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  public async ping(
    timeoutMs = 5000,
  ): Promise<{ timestamp: number; swVersion: string }> {
    try {
      console.log('[SW Manager] Sending ping...');
      const response = await this.sendMessage(
        'PING',
        undefined,
        true,
        timeoutMs,
      );
      console.log('[SW Manager] Ping successful:', response);
      return response;
    } catch (error) {
      console.error('[SW Manager] Ping failed:', error);
      throw error;
    }
  }

  public async unregister(): Promise<boolean> {
    console.log('[SW Manager] Unregistering service worker...');
    if (this.registration) {
      const result = await this.registration.unregister();
      this.registration = null;
      console.log('[SW Manager] Unregistration result:', result);
      return result;
    }
    return false;
  }

  public isReady(): boolean {
    return !!this.registration && !!this.registration.active;
  }

  // Static method to create and write service worker file (for build tools/scripts)
  public static async createServiceWorkerFile(
    outputPath: string,
    customScript?: string,
  ): Promise<void> {
    const fs = await import('fs').catch(() => null);
    const path = await import('path').catch(() => null);

    if (!fs || !path) {
      throw new Error(
        'File system operations not available in this environment',
      );
    }

    const manager = new ServiceWorkerManager();
    const script = customScript || manager.getServiceWorkerScript();

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, script);
    console.log(`Service worker created at: ${outputPath}`);
  }
}

// Factory functions for different use cases
export const createServiceWorkerManager = (
  config?: ServiceWorkerConfig,
): ServiceWorkerManager => {
  return new ServiceWorkerManager(config);
};

export const initServiceWorker = async (
  config?: ServiceWorkerConfig,
): Promise<ServiceWorkerManager> => {
  const manager = new ServiceWorkerManager(config);
  await manager.initialize();
  await manager.ping(); // Verify connection
  return manager;
};

// For build-time generation
export const generateServiceWorker =
  ServiceWorkerManager.createServiceWorkerFile;

export default ServiceWorkerManager;
