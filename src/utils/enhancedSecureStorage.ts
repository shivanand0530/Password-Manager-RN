import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptPassword, decryptPassword } from './encryption';

/**
 * Enhanced secure storage using your existing encryption utilities
 * This provides enterprise-grade AES encryption for Redux Persist
 */
class EnhancedSecureStorage {
  private static readonly ENCRYPTION_PREFIX = '__ENCRYPTED__';
  
  static async setItem(key: string, value: string): Promise<void> {
    try {
     
      const encryptedValue = await encryptPassword(value);
      const prefixedValue = this.ENCRYPTION_PREFIX + encryptedValue;
      
      await AsyncStorage.setItem(key, prefixedValue);

    } catch (error) {
      console.error(` Failed to encrypt and store ${key}:`, error);
      throw error;
    }
  }
  
  static async getItem(key: string): Promise<string | null> {
    try {
      const storedValue = await AsyncStorage.getItem(key);
      if (!storedValue) {
        return null;
      }
      
      // Check if data is encrypted (has our prefix)
      if (storedValue.startsWith(this.ENCRYPTION_PREFIX)) {
        const encryptedValue = storedValue.slice(this.ENCRYPTION_PREFIX.length);
        const decryptedValue = await decryptPassword(encryptedValue);
        
        return decryptedValue;
      }
      return storedValue;
      
    } catch (error) {
      console.error(`❌ Failed to decrypt ${key}:`, error);
      
      return null;
    }
  }
  
  static async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
  
  static async getAllKeys(): Promise<readonly string[]> {
    return await AsyncStorage.getAllKeys();
  }
  
  static async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
  
  // Debug method to check encryption status
  static async isDataEncrypted(key: string): Promise<boolean> {
    const value = await AsyncStorage.getItem(key);
    return value ? value.startsWith(this.ENCRYPTION_PREFIX) : false;
  }
  
  // Migration helper to encrypt existing unencrypted data
  static async migrateToEncrypted(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value || value.startsWith(this.ENCRYPTION_PREFIX)) {
        return true; 
      }
      
      await this.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`❌ Failed to migrate ${key} to encrypted storage:`, error);
      return false;
    }
  }
}

export default EnhancedSecureStorage;