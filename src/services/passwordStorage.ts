import AsyncStorage from '@react-native-async-storage/async-storage';
import { PasswordEntry } from '@/types/password';
import { encryptPassword, decryptPassword } from '@/utils/encryption';
import { 
  initDatabase,
  initializeDatabaseSafely,
  savePassword,
  getAllPasswords,
  updatePassword as updatePasswordInDb,
  deletePassword as deletePasswordFromDb,
  getPasswordById,
  exportDatabaseFile,
  testDatabasePersistence,
} from './database';

const OLD_STORAGE_KEY = 'password_entries';

// For debugging
const DEBUG = true;

export class PasswordStorage {
  static async initialize(): Promise<void> {
    try {
     
      const { initializeDatabaseSafely } = await import('./database');
      await initializeDatabaseSafely();
      
      await this.migrateFromAsyncStorage();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private static async migrateFromAsyncStorage(): Promise<void> {
    try {
      
      const stored = await AsyncStorage.getItem(OLD_STORAGE_KEY);
      
      if (!stored) {
        
        return;
      }
      
      let passwords: PasswordEntry[];
      try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          throw new Error('Stored data is not an array');
        }
        
        // Validate and convert dates
        passwords = parsed.map(entry => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));
        
      } catch (parseError) {
        console.error('Error parsing AsyncStorage data:', parseError);
        throw new Error('Failed to parse AsyncStorage data during migration');
      }
     
      for (const password of passwords) {
        try {
          await savePassword(password);
         
        } catch (saveError) {
          console.error(`Error migrating password ${password.id}:`, saveError);
          // Continue with other passwords even if one fails
        }
      }
      
      // Verify migration
      const migratedPasswords = await getAllPasswords();
     if (migratedPasswords.length >= passwords.length) {
        await AsyncStorage.removeItem(OLD_STORAGE_KEY);
      } else {
        console.warn('Migration may be incomplete. Keeping AsyncStorage data as backup');
      }
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error('Failed to migrate data from AsyncStorage to SQLite');
    }
  }

  private static initialized = false;

  private static async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
  }

  static async loadPasswords(): Promise<PasswordEntry[]> {
    try {
      await this.ensureInitialized();
      const encryptedPasswords = await getAllPasswords();
      
      const passwords = await Promise.all(
        encryptedPasswords.map(async (entry, index) => {
          try {
            const decrypted = {
              ...entry,
              password: await decryptPassword(entry.password),
            };
             return decrypted;
          } catch (err) {
           return entry;
          }
        })
      );
      
     
      if (passwords.length > 0) {
        console.log('First password entry (decrypted):', {
          ...passwords[0],
          password: '***HIDDEN***'
        });
      }
      return passwords;
    } catch (error) {
      console.error('Failed to load passwords:', error);
      throw error;
    }
  }

  static async addPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordEntry> {
    try {
      await this.ensureInitialized();
        // console.log('Adding new password:', { ...entry, password: '***HIDDEN***' });
        
      const newEntry: PasswordEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Encrypt the password before saving
      const encryptedEntry = {
        ...newEntry,
        password: await encryptPassword(newEntry.password),
      };
      
     
      await savePassword(encryptedEntry);
      
      // Verify the password was saved
      const savedEntry = await getPasswordById(newEntry.id);
      if (savedEntry) {
        // console.log('Successfully verified new password was saved with ID:', newEntry.id);
      } else {
        console.error('New password was not found in verification load! ID:', newEntry.id);
        throw new Error('Failed to verify password was saved');
      }
      
      // Return the new entry (with plain password, not encrypted)
      return newEntry;
    } catch (error) {
      console.error('Error saving new password:', error);
      throw error;
    }
  }

  static async updatePassword(id: string, updates: Partial<PasswordEntry>): Promise<void> {
    try {
      await this.ensureInitialized();
     
      const existingEntry = await getPasswordById(id);
      if (!existingEntry) {
        throw new Error(`Password with ID ${id} not found`);
      }

      let encryptedUpdates = { ...updates };
      if (updates.password) {
        encryptedUpdates.password = await encryptPassword(updates.password);
      }

      // Merge updates with existing entry
      const updatedEntry: PasswordEntry = {
        ...existingEntry,
        ...encryptedUpdates,
        updatedAt: new Date(),
      };

      await updatePasswordInDb(updatedEntry);
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }

  static async deletePassword(id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      await deletePasswordFromDb(id);
    } catch (error) {
      console.error('Failed to delete password:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await this.ensureInitialized();
      await initDatabase();
    } catch (error) {
      console.error('Failed to clear password data:', error);
      throw error;
    }
  }

  static async exportDatabase(): Promise<string> {
    try {
      await this.ensureInitialized();
      const exportPath = await exportDatabaseFile();
      return exportPath;
    } catch (error) {
      console.error('Failed to export database:', error);
      throw error;
    }
  }

  // Debug function to test database persistence
  static async testPersistence(): Promise<void> {
    try {
      await this.ensureInitialized();
      await testDatabasePersistence();
    } catch (error) {
      console.error('Failed to test database persistence:', error);
      throw error;
    }
  }
}