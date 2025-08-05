import AsyncStorage from '@react-native-async-storage/async-storage';
import { PasswordEntry } from '@/types/password';
import { encryptPassword, decryptPassword } from '@/utils/encryption';

// For debugging
const DEBUG = true;

const STORAGE_KEY = 'password_entries';

export class PasswordStorage {
  static async savePasswords(passwords: PasswordEntry[]): Promise<void> {
    try {
      console.log('Saving passwords, count:', passwords.length);
      if (passwords.length > 0) {
        console.log('First password ID being saved:', passwords[0].id);
      }
      
      const encryptedPasswords = await Promise.all(
        passwords.map(async (entry, index) => {
          try {
            const encrypted = {
              ...entry,
              password: await encryptPassword(entry.password),
            };
            console.log(`Successfully encrypted password ${index + 1}/${passwords.length} with ID: ${entry.id}`);
            return encrypted;
          } catch (err) {
            console.error(`Error encrypting password ${index + 1} with ID ${entry.id}:`, err);
            // Return with original password if encryption fails
            return entry;
          }
        })
      );
      
      const jsonData = JSON.stringify(encryptedPasswords);
      console.log('JSON data length:', jsonData.length);
      console.log('JSON data first 100 chars:', jsonData.substring(0, 100));
      
      await AsyncStorage.setItem(STORAGE_KEY, jsonData);
      console.log('Passwords saved to AsyncStorage');
      
      // Verify data was saved correctly
      const verifyData = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Verification - data exists:', !!verifyData);
      if (verifyData) {
        console.log('Verification - data length:', verifyData.length);
        
        try {
          const verifyParsed = JSON.parse(verifyData);
          console.log('Verification - parsed data count:', verifyParsed.length);
          if (verifyParsed.length !== passwords.length) {
            console.error('Verification FAILED - count mismatch:', verifyParsed.length, 'vs', passwords.length);
          } else {
            console.log('Verification SUCCESS - count matches');
          }
        } catch (parseErr) {
          console.error('Verification FAILED - could not parse stored data:', parseErr);
        }
      } else {
        console.error('Verification FAILED - no data found after save');
      }
    } catch (error) {
      console.error('Failed to save passwords:', error);
      throw error;
    }
  }

  static async loadPasswords(): Promise<PasswordEntry[]> {
    try {
      console.log('Loading passwords from storage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        console.log('No passwords found in storage');
        return [];
      }
      
      console.log('Raw stored data length:', stored.length);
      console.log('Raw stored data first 100 chars:', stored.substring(0, 100));
      
      let encryptedPasswords;
      try {
        encryptedPasswords = JSON.parse(stored);
        console.log('Parsed passwords count:', encryptedPasswords.length);
        if (encryptedPasswords.length > 0) {
          console.log('First password entry (encrypted):', {
            ...encryptedPasswords[0],
            password: '***HIDDEN***'
          });
        }
      } catch (parseError) {
        console.error('Error parsing stored passwords JSON:', parseError);
        return [];
      }
      
      const passwords = await Promise.all(
        encryptedPasswords.map(async (entry: any, index: number) => {
          try {
            const decrypted = {
              ...entry,
              password: await decryptPassword(entry.password),
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt),
            };
            console.log(`Successfully decrypted password ${index + 1}/${encryptedPasswords.length}`);
            return decrypted;
          } catch (err) {
            console.error(`Error processing password entry ${index + 1}:`, err);
            console.log('Problematic entry:', { ...entry, password: '***HIDDEN***' });
            // Return the entry with original password if decryption fails
            return {
              ...entry,
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt),
            };
          }
        })
      );
      
      console.log('Processed passwords count:', passwords.length);
      if (passwords.length > 0) {
        console.log('First password entry (decrypted):', {
          ...passwords[0],
          password: '***HIDDEN***'
        });
      }
      return passwords;
    } catch (error) {
      console.error('Failed to load passwords:', error);
      return [];
    }
  }

  static async addPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    console.log('Adding new password:', { ...entry, password: '***HIDDEN***' });
    
    const passwords = await this.loadPasswords();
    console.log('Current passwords count before adding:', passwords.length);
    
    const newEntry: PasswordEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('New entry created with ID:', newEntry.id);
    
    passwords.push(newEntry);
    console.log('New passwords array length after push:', passwords.length);
    
    try {
      await this.savePasswords(passwords);
      console.log('Password saved successfully to AsyncStorage');
      
      // Verify the password was saved
      const verifyPasswords = await this.loadPasswords();
      console.log('Verified passwords count after save:', verifyPasswords.length);
      
      // Check if our new password is in the loaded passwords
      const savedEntry = verifyPasswords.find(p => p.id === newEntry.id);
      if (savedEntry) {
        console.log('Successfully verified new password was saved with ID:', newEntry.id);
      } else {
        console.error('New password was not found in verification load! ID:', newEntry.id);
      }
    } catch (error) {
      console.error('Error saving new password:', error);
      throw error;
    }
  }

  static async updatePassword(id: string, updates: Partial<PasswordEntry>): Promise<void> {
    const passwords = await this.loadPasswords();
    const index = passwords.findIndex(p => p.id === id);
    if (index !== -1) {
      passwords[index] = {
        ...passwords[index],
        ...updates,
        updatedAt: new Date(),
      };
      await this.savePasswords(passwords);
    }
  }

  static async deletePassword(id: string): Promise<void> {
    const passwords = await this.loadPasswords();
    const filtered = passwords.filter(p => p.id !== id);
    await this.savePasswords(filtered);
  }
}