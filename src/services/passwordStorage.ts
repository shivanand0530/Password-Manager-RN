import AsyncStorage from '@react-native-async-storage/async-storage';
import { PasswordEntry } from '@/types/password';
import { encryptPassword, decryptPassword } from '@/utils/encryption';
import { 
  initDatabase,
  savePassword,
  getAllPasswords,
  updatePassword as updatePasswordInDb,
  deletePassword as deletePasswordFromDb,
  getPasswordById,
  exportDatabaseFile,
} from './database';

const OLD_STORAGE_KEY = 'password_entries';

// For debugging
const DEBUG = true;

export class PasswordStorage {
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing SQLite database...');
      await initDatabase();
      console.log('SQLite database initialized successfully');
      
      // Check if we need to migrate data from AsyncStorage
      await this.migrateFromAsyncStorage();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private static async migrateFromAsyncStorage(): Promise<void> {
    try {
      console.log('Checking for data in AsyncStorage...');
      const stored = await AsyncStorage.getItem(OLD_STORAGE_KEY);
      
      if (!stored) {
        console.log('No data found in AsyncStorage to migrate');
        return;
      }
      
      console.log('Found data in AsyncStorage, beginning migration...');
      
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
      
      console.log(`Found ${passwords.length} passwords to migrate`);
      
      // Save each password to SQLite
      for (const password of passwords) {
        try {
          await savePassword(password);
          console.log(`Migrated password with ID: ${password.id}`);
        } catch (saveError) {
          console.error(`Error migrating password ${password.id}:`, saveError);
          // Continue with other passwords even if one fails
        }
      }
      
      // Verify migration
      const migratedPasswords = await getAllPasswords();
      console.log(`Migration complete. Verified ${migratedPasswords.length} passwords in SQLite`);
      
      // Clear AsyncStorage data only if migration was successful
      if (migratedPasswords.length >= passwords.length) {
        await AsyncStorage.removeItem(OLD_STORAGE_KEY);
        console.log('Successfully cleared old AsyncStorage data');
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
      console.log('Loading passwords from SQLite...');
      const encryptedPasswords = await getAllPasswords();
      
      const passwords = await Promise.all(
        encryptedPasswords.map(async (entry, index) => {
          try {
            const decrypted = {
              ...entry,
              password: await decryptPassword(entry.password),
            };
            console.log(`Successfully decrypted password ${index + 1}/${encryptedPasswords.length}`);
            return decrypted;
          } catch (err) {
            console.error(`Error processing password entry ${index + 1}:`, err);
            console.log('Problematic entry:', { ...entry, password: '***HIDDEN***' });
            // Return the entry with original password if decryption fails
            return entry;
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
      throw error;
    }
  }

  static async addPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('Adding new password:', { ...entry, password: '***HIDDEN***' });
      
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
      
      console.log('New entry created with ID:', newEntry.id);
      
      await savePassword(encryptedEntry);
      console.log('Password saved successfully to SQLite');
      
      // Verify the password was saved
      const savedEntry = await getPasswordById(newEntry.id);
      if (savedEntry) {
        console.log('Successfully verified new password was saved with ID:', newEntry.id);
      } else {
        console.error('New password was not found in verification load! ID:', newEntry.id);
        throw new Error('Failed to verify password was saved');
      }
    } catch (error) {
      console.error('Error saving new password:', error);
      throw error;
    }
  }

  static async updatePassword(id: string, updates: Partial<PasswordEntry>): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('Updating password:', id);
      
      // Get the existing password entry
      const existingEntry = await getPasswordById(id);
      if (!existingEntry) {
        throw new Error(`Password with ID ${id} not found`);
      }

      // If the password field is being updated, encrypt it
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
      console.log('Password updated successfully');
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }

  static async deletePassword(id: string): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('Deleting password:', id);
      await deletePasswordFromDb(id);
      console.log('Password deleted successfully');
    } catch (error) {
      console.error('Failed to delete password:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('Clearing all password data...');
      // Re-initialize the database to clear all data
      await initDatabase();
      console.log('All password data cleared successfully');
    } catch (error) {
      console.error('Failed to clear password data:', error);
      throw error;
    }
  }

  static async exportDatabase(): Promise<string> {
    try {
      await this.ensureInitialized();
      console.log('Exporting database file...');
      const exportPath = await exportDatabaseFile();
      console.log('Database exported successfully to:', exportPath);
      return exportPath;
    } catch (error) {
      console.error('Failed to export database:', error);
      throw error;
    }
  }
}