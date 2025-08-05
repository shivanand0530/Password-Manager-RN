import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const ENCRYPTION_KEY = 'password-manager-key-2024';

export async function encryptPassword(password: string): Promise<string> {
  try {
    // Simple encryption for demo purposes
    const combined = ENCRYPTION_KEY + password;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    
    // Use btoa for base64 encoding instead of Buffer
    // This works in both web and React Native environments
    const base64Password = Platform.OS === 'web' 
      ? btoa(password) 
      : encodeBase64(password);
      
    return base64Password + '.' + hash.substring(0, 16);
  } catch (error) {
    console.error('Encryption failed:', error);
    return password;
  }
}

export async function decryptPassword(encryptedPassword: string): Promise<string> {
  try {
    const [encodedPassword] = encryptedPassword.split('.');
    
    // Use atob for base64 decoding instead of Buffer
    // This works in both web and React Native environments
    return Platform.OS === 'web'
      ? atob(encodedPassword)
      : decodeBase64(encodedPassword);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedPassword;
  }
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