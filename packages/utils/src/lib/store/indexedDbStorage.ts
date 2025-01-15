import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { IStore } from './store.interface';

/**
 * IndexedDB-based store for wallet-related data, implements IStore.
 *
 * @class
 * @implements {IStore}
 */
export class IndexedDBStore implements IStore {
  private readonly DB_NAME = 'garden_finance_secrets';
  private readonly STORE_NAME = 'wallet_data';
  private readonly DB_VERSION = 2;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open database'));

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  async getAsyncItem(key: string): AsyncResult<string, null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await new Promise<string | null>((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key.toLowerCase());

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
    return result ? Ok(result) : Err(null);
  }

  getItem(key: string): string | null {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.get(key.toLowerCase());

    let result = null;
    request.onsuccess = () => {
      result = request.result || null;
    };
    return result;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(value, key.toLowerCase());
      request.onerror = () => reject(new Error('Failed to store item'));
      request.onsuccess = () => resolve();
    });
  }

  async removeItem(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key.toLowerCase());
      request.onerror = () => reject(new Error('Failed to remove item'));
      request.onsuccess = () => resolve();
    });
  }
}
