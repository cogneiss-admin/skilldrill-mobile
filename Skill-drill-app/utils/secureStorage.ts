import * as SecureStore from 'expo-secure-store';

/**
 * Custom SecureStore adapter for redux-persist
 *
 * Implements the storage interface required by redux-persist:
 * - getItem(key): Promise<string | null>
 * - setItem(key, value): Promise<void>
 * - removeItem(key): Promise<void>
 *
 * This adapter wraps expo-secure-store to provide encrypted storage
 * for sensitive Redux state (auth tokens).
 */

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage: Error getting item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`SecureStorage: Error setting item ${key}:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`SecureStorage: Error removing item ${key}:`, error);
    }
  },
};

export default secureStorage;
