// Migration utility to move data from SQLite to Redux Persist
import { PasswordStorage } from '../services/passwordStorage';
import { store } from '../store/persistedStore';
import { savePassword, clearAllPasswords } from '@/store/Slices/passwordSliceSimplified';

export class SQLiteToReduxMigration {
  static async migrateData(): Promise<{ success: boolean; migratedCount: number; error?: string }> {
    try {
      const sqlitePasswords = await PasswordStorage.loadPasswords();
      
      if (sqlitePasswords.length === 0) {
        return { success: true, migratedCount: 0 };
      }
      
      store.dispatch(clearAllPasswords());
      
      let migratedCount = 0;
      
      for (const password of sqlitePasswords) {
        try {
          // Remove the id, createdAt, updatedAt as they'll be regenerated
          const { id, createdAt, updatedAt, ...passwordData } = password;
          
          // Save to Redux Persist
          await store.dispatch(savePassword(passwordData)).unwrap();
          migratedCount++;
        } catch (error) {
          console.error(`Failed to migrate password "${password.title}":`, error);
        }
      }
      
      return {
        success: true,
        migratedCount,
      };
      
    } catch (error) {
      console.error(' Migration failed:', error);
      return {
        success: false,
        migratedCount: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  static async verifyMigration(): Promise<{ sqliteCount: number; reduxCount: number; match: boolean }> {
    try {
      // Count SQLite passwords
      const sqlitePasswords = await PasswordStorage.loadPasswords();
      const sqliteCount = sqlitePasswords.length;
      
      // Count Redux passwords
      const reduxState = store.getState();
      const reduxCount = reduxState.passwords.passwords.length;
      const match = sqliteCount === reduxCount;

      return { sqliteCount, reduxCount, match };
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return { sqliteCount: 0, reduxCount: 0, match: false };
    }
  }
  
  // Optional: Clean up SQLite data after successful migration
  static async cleanupSQLite(): Promise<boolean> {
    try {
     
      await PasswordStorage.clearAllData();
      return true;
    } catch (error) {
      console.error('Failed to cleanup SQLite:', error);
      return false;
    }
  }
}