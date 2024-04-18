import { IStore } from './store.interface';
/**
 * In-memory storage implementation.
 *
 * @class
 * @implements {IStore}
 */
export declare class MemoryStorage implements IStore {
    private memory;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
