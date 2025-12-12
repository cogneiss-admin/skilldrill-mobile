import * as SecureStore from 'expo-secure-store';

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const sanitizedKey = sanitizeKey(key);
      return await SecureStore.getItemAsync(sanitizedKey);
    } catch (error) {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      const sanitizedKey = sanitizeKey(key);
      await SecureStore.setItemAsync(sanitizedKey, value);
    } catch (error) {
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const sanitizedKey = sanitizeKey(key);
      await SecureStore.deleteItemAsync(sanitizedKey);
    } catch (error) {
    }
  },
};

export default secureStorage;
