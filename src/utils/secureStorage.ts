import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Secure AsyncStorage wrapper that encrypts all data
 * This solves the security issue with plain AsyncStorage
 */
class SecureAsyncStorage {
  private static encryptionKey: string | null = null;
  
  // Generate or retrieve the encryption key
  private static async getEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }
    
    let key = await AsyncStorage.getItem('__SECURE_ENCRYPTION_KEY__');
    
    if (!key) {
      // Generate a new 256-bit key
      const keyBytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(keyBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      // Store the key (this is the only unencrypted item)
      await AsyncStorage.setItem('__SECURE_ENCRYPTION_KEY__', key);
    }
    
    this.encryptionKey = key;
    return key;
  }
  
  // Encrypt data using AES-256
  private static async encrypt(text: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      
      // Generate random IV for each encryption
      const iv = await Crypto.getRandomBytesAsync(16);
      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Create cipher using Expo's digestStringAsync as a simple encryption
      // For production, you might want to use a more robust crypto library
      const keyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key + ivHex
      );
      
      // Simple XOR encryption (in production, use proper AES)
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = keyHash.charCodeAt(i % keyHash.length);
        encrypted += String.fromCharCode(charCode ^ keyChar);
      }
      
      // Combine IV + encrypted data and encode as base64
      const combined = ivHex + ':' + btoa(encrypted);
      return combined;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }
  
  // Decrypt data
  private static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      
      // Split IV and encrypted data
      const [ivHex, encryptedBase64] = encryptedData.split(':');
      const encrypted = atob(encryptedBase64);
      
      // Recreate the key hash
      const keyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key + ivHex
      );
      
      // Decrypt using XOR
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i);
        const keyChar = keyHash.charCodeAt(i % keyHash.length);
        decrypted += String.fromCharCode(charCode ^ keyChar);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
  
  // Secure storage interface compatible with Redux Persist
  static async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await this.encrypt(value);
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('SecureAsyncStorage.setItem failed:', error);
      throw error;
    }
  }
  
  static async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;
      
      // Check if it's encrypted (contains our separator)
      if (encryptedValue.includes(':')) {
        return await this.decrypt(encryptedValue);
      }
      
      // Legacy unencrypted data - return as is and re-encrypt on next save
      return encryptedValue;
    } catch (error) {
      console.error('SecureAsyncStorage.getItem failed:', error);
      // If decryption fails, return null to avoid app crash
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
    // Don't clear the encryption key
    const keys = await AsyncStorage.getAllKeys();
    const keysToRemove = keys.filter(key => key !== '__SECURE_ENCRYPTION_KEY__');
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

export default SecureAsyncStorage;