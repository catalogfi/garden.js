export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private serviceWorker: ServiceWorker | null = null;
  private isRegistered = false;

  private constructor() {}

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  public async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser');
      return;
    }

    if (this.isRegistered) {
      console.log('Service Worker already registered');
      return;
    }

    try {
      console.log('Registering Garden Service Worker...');

      const response = await fetch('/garden-service-worker.js');
      if (!response.ok) {
        throw new Error(`Service worker file not found: ${response.status}`);
      }

      const registration = await navigator.serviceWorker.register(
        '/garden-service-worker.js',
        {
          scope: '/',
        },
      );

      console.log(
        'Garden Service Worker registered successfully:',
        registration,
      );

      await new Promise<void>((resolve) => {
        if (registration.active) {
          this.serviceWorker = registration.active;
          this.isRegistered = true;
          resolve();
        } else {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  this.serviceWorker = newWorker;
                  this.isRegistered = true;
                  resolve();
                }
              });
            }
          });
        }
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from Service Worker:', event.data);
      });

      console.log('Garden Service Worker is ready and active');
    } catch (error) {
      console.error('Failed to register Garden Service Worker:', error);
      console.log(
        'Make sure garden-service-worker.js is in your public folder',
      );
    }
  }

  public notifyGardenInitialized(gardenInstance: any): void {
    if (!this.serviceWorker || !this.isRegistered) {
      console.warn(
        'Service Worker not ready, cannot notify of Garden initialization',
      );
      return;
    }

    try {
      this.serviceWorker.postMessage({
        type: 'GARDEN_INITIALIZED',
        payload: {
          timestamp: new Date().toISOString(),
          gardenId: gardenInstance?.id || 'unknown',
        },
      });

      console.log('Notified Service Worker about Garden initialization');
    } catch (error) {
      console.error('Failed to notify Service Worker:', error);
    }
  }

  public async unregisterServiceWorker(): Promise<void> {
    if (!this.isRegistered) {
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes('garden')) {
          await registration.unregister();
          console.log('Garden Service Worker unregistered');
        }
      }
      this.isRegistered = false;
      this.serviceWorker = null;
    } catch (error) {
      console.error('Failed to unregister Service Worker:', error);
    }
  }
}
