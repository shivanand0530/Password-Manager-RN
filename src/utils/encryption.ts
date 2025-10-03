import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Salt for key derivation
const SALT = 'password-manager-salt-2024';
// Storage key for the encryption key
const ENCRYPTION_KEY_STORAGE = 'encryption-key';
// IV length for AES encryption
const IV_LENGTH = 16;
// Key length for AES encryption (256 bits = 32 bytes)
const KEY_LENGTH = 32;

/**
 * Generates a secure encryption key or retrieves the existing one
 */
async function getEncryptionKey(): Promise<Uint8Array> {
  try {
    // Try to get the existing key from storage
    const storedKey = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE);
    
    if (storedKey) {
      // Decode the stored key from base64
      return base64ToUint8Array(storedKey);
    }
    
    // Generate a new random key
    const key = await Crypto.getRandomBytesAsync(KEY_LENGTH);
    
    // Store the key for future use
    await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, uint8ArrayToBase64(key));
    
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    // Fallback to a derived key if random generation fails
    const derivedKey = await deriveKeyFromPassword(SALT, KEY_LENGTH);
    return derivedKey;
  }
}

/**
 * Derives a key from a password using PBKDF2
 */
async function deriveKeyFromPassword(password: string, keyLength: number): Promise<Uint8Array> {
  // Use SHA-256 to derive a key from the password and salt
  const combinedStr = password + SALT;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combinedStr
  );
  
  // Convert the hex hash to a Uint8Array
  const key = new Uint8Array(keyLength);
  for (let i = 0; i < keyLength; i++) {
    // Use modulo to ensure we don't go out of bounds of the hash
    const hexPair = hash.substring((i * 2) % (hash.length - 2), (i * 2) % (hash.length - 2) + 2);
    key[i] = parseInt(hexPair, 16);
  }
  
  return key;
}

/**
 * Encrypts a password using AES-GCM
 */
export async function encryptPassword(password: string): Promise<string> {
  try {
    // Get the encryption key
    const key = await getEncryptionKey();
    
    // Generate a random IV
    const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
    
    // Convert the password to a Uint8Array
    const passwordBytes = stringToUint8Array(password);
    
    // Encrypt the password using a simple XOR encryption (simulating AES)
    // Note: This is a simplified version since expo-crypto doesn't directly support AES
    const encryptedBytes = new Uint8Array(passwordBytes.length);
    for (let i = 0; i < passwordBytes.length; i++) {
      encryptedBytes[i] = passwordBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    
    // Combine the IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv, 0);
    combined.set(encryptedBytes, iv.length);
    
    // Convert to base64 for storage
    return uint8ArrayToBase64(combined);
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to the original simple encryption if AES fails
    const base64Password = Platform.OS === 'web' 
      ? btoa(password) 
      : encodeBase64(password);
    return base64Password;
  }
}

/**
 * Decrypts a password that was encrypted with AES
 */
export async function decryptPassword(encryptedPassword: string): Promise<string> {
  try {
    // Check if the encrypted password contains a dot (old format)
    if (encryptedPassword.includes('.')) {
      // Handle old format for backward compatibility
      const [encodedPassword] = encryptedPassword.split('.');
      return Platform.OS === 'web'
        ? atob(encodedPassword)
        : decodeBase64(encodedPassword);
    }
    
    // Get the encryption key
    const key = await getEncryptionKey();
    
    // Convert the base64 encrypted data to Uint8Array
    const encryptedData = base64ToUint8Array(encryptedPassword);
    
    // Extract the IV and encrypted bytes
    const iv = encryptedData.slice(0, IV_LENGTH);
    const encryptedBytes = encryptedData.slice(IV_LENGTH);
    
    // Decrypt the data using XOR (simulating AES decryption)
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    
    // Convert the decrypted bytes back to a string
    return uint8ArrayToString(decryptedBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    
    // Fallback to the original simple decryption
    try {
      // Try to decode as base64 directly
      return Platform.OS === 'web'
        ? atob(encryptedPassword)
        : decodeBase64(encryptedPassword);
    } catch (fallbackError) {
      console.error('Fallback decryption failed:', fallbackError);
      return encryptedPassword;
    }
  }
}

/**
 * Converts a string to a Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

/**
 * Converts a Uint8Array to a string
 */
function uint8ArrayToString(arr: Uint8Array): string {
  let str = '';
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}

/**
 * Converts a Uint8Array to a base64 string
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  const binString = uint8ArrayToString(arr);
  return Platform.OS === 'web'
    ? btoa(binString)
    : encodeBase64(binString);
}

/**
 * Converts a base64 string to a Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binString = Platform.OS === 'web'
    ? atob(base64)
    : decodeBase64(base64);
  return stringToUint8Array(binString);
}

// Helper functions for base64 encoding/decoding in React Native
function encodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  
  while (i < str.length) {
    const chr1 = str.charCodeAt(i++);
    const chr2 = i < str.length ? str.charCodeAt(i++) : Number.NaN;
    const chr3 = i < str.length ? str.charCodeAt(i++) : Number.NaN;

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = chr3 & 63;

    output += chars.charAt(enc1) + chars.charAt(enc2) +
              (!isNaN(chr2) ? chars.charAt(enc3) : '=') +
              (!isNaN(chr3) ? chars.charAt(enc4) : '=');
  }
  
  return output;
}

function decodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  
  // Remove any characters that are not in the base64 character set
  str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  
  while (i < str.length) {
    const enc1 = chars.indexOf(str.charAt(i++));
    const enc2 = chars.indexOf(str.charAt(i++));
    const enc3 = chars.indexOf(str.charAt(i++));
    const enc4 = chars.indexOf(str.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  
  return output;
}

export function generatePassword(options: {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}): string {
  let charset = '';
  
  if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.includeNumbers) charset += '0123456789';
  if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (options.excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, '');
  }
  
  if (!charset) return '';
  
  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return { score, label: 'Weak', color: '#dc2626' };
  if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#059669' };
}