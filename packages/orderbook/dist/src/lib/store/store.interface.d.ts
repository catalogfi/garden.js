/**
 * Interface for a Store.
 *
 * @interface IStore
 *
 */
export interface IStore {
    /**
     * Retrieves an item from the store using the provided key.
     * @param {string} key - The key of the item to retrieve.
     * @returns {string | number} The item associated with the key, or null if no item is found.
     *
     */
    getItem(key: string): string | null;
    /**
     * @method setItem - Sets an item in the store with the provided key and value.
     * @param {string} key - The key to associate with the item.
     * @param {any} value - The value of the item to store.
     * @returns {void}
     *
     */
    setItem(key: string, value: any): void;
    /**
     * @method removeItem - Removes an item from the store using the provided key.
     * @param {string} key - The key of the item to remove.
     * @returns {void}
     *
     */
    removeItem(key: string): void;
}
export declare enum StoreKeys {
    AUTH_TOKEN = "auth_token"
}
