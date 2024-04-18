import { IStore } from './store.interface';

/**
 * In-memory storage implementation.
 *
 * @class
 * @implements {IStore}
 */
export class MemoryStorage implements IStore {
  private memory: Map<string, string> = new Map();

  getItem(key: string): string | null {
    if (!this.memory.has(key)) {
      return null;
    }
    return this.memory.get(key)!;
  }
  setItem(key: string, value: string): void {
    this.memory.set(key, value);
  }

  removeItem(key: string): void {
    if (!this.memory.has(key)) {
      return;
    }
    this.memory.delete(key);
  }
}
