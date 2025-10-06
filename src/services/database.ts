import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { PasswordEntry } from '../types/password';

// Database name
const DB_NAME = 'passwords.db';

// Get database location for debugging
export const getDatabaseInfo = async (): Promise<{ name: string; directory: string; exists: boolean }> => {
  const directory = FileSystem.documentDirectory + 'SQLite/';
  const path = directory + DB_NAME;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(path);
    console.log('Database Location Info:', {
      name: DB_NAME,
      directory,
      path,
      platform: Platform.OS,
      documentDirectory: FileSystem.documentDirectory,
      exists: fileInfo.exists,
    });
    
    return {
      name: DB_NAME,
      directory,
      exists: fileInfo.exists,
    };
  } catch (error) {
    console.error('Error checking database file:', error);
    return {
      name: DB_NAME,
      directory,
      exists: false,
    };
  }
};

// Export database file
const exportDatabaseFile = async (): Promise<string> => {
  try {
    // Close the database connection to ensure all changes are written
    await db.closeAsync();
    
    // Get current database path
    const dbPath = FileSystem.documentDirectory + 'SQLite/' + DB_NAME;
    // console.log('Exporting database from:', dbPath);
    
    // Setup export path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFileName = `passwords-backup-${timestamp}.db`;
    const exportPath = FileSystem.cacheDirectory + exportFileName;
    // console.log('Exporting database to:', exportPath);

    try {
      // Ensure database file exists
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        throw new Error(`Database file not found at ${dbPath}`);
      }

      // Copy the database file
      await FileSystem.copyAsync({
        from: dbPath,
        to: exportPath
      });
      console.log('Database exported successfully');

    } finally {
      // Always reopen the database
      db = await SQLite.openDatabaseAsync(DB_NAME);
      await createTables(db);
    }
    
    return exportPath;
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
};

// Initialize database schema
const createTables = async (database: SQLite.SQLiteDatabase) => {
  try {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS passwords (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        username TEXT,
        password TEXT NOT NULL,
        website TEXT,
        notes TEXT,
        category TEXT NOT NULL,
        isFavorite INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};

// Open/create the database
let db: SQLite.SQLiteDatabase;
const initializeDb = async () => {
  try {
    // Create/open database using modern API
    db = await SQLite.openDatabaseAsync(DB_NAME);
    // console.log('Database opened successfully');
    
    // Initialize schema
    await createTables(db);
    
    // Log database info
    const info = await getDatabaseInfo();
    // console.log('Database fully initialized:', info);
    
    // Verify tables
    const tables = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");
    // console.log('Database tables:', tables);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Initialize the database
initializeDb().catch(error => {
  console.error('Failed to initialize database:', error);
});

// Initialize/reset the database if needed (DESTROYS ALL DATA - use with caution!)
const initDatabase = async (): Promise<void> => {
  try {
    // Drop and recreate the table to reset it
    await db.execAsync('DROP TABLE IF EXISTS passwords');
    await createTables(db);
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Safe initialization - creates tables if they don't exist, preserves existing data
const initializeDatabaseSafely = async (): Promise<void> => {
  try {
    // Ensure database is initialized
    if (!db) {
      await initializeDb();
    }
    // Tables are already created in initializeDb, so just verify
    // console.log('Database safely initialized - existing data preserved');
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Test database persistence (debugging utility)
const testDatabasePersistence = async (): Promise<void> => {
  try {
    const info = await getDatabaseInfo();
    
    const passwordCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM passwords'
    );
    console.log('  Password Count:', passwordCount?.count || 0);
  } catch (error: unknown) {
    console.error(' Database persistence test failed:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Save a new password
const savePassword = async (password: PasswordEntry): Promise<void> => {
  const { id, title, username, password: pass, website, notes, category, isFavorite, createdAt, updatedAt } = password;
  try {
    await db.runAsync(
      `INSERT INTO passwords (id, title, username, password, website, notes, category, isFavorite, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, username, pass, website || null, notes || null, category, isFavorite ? 1 : 0, createdAt.toISOString(), updatedAt.toISOString()]
    );
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Get all passwords
const getAllPasswords = async (): Promise<PasswordEntry[]> => {
  try {
    const rows = await db.getAllAsync<{
      id: string;
      title: string;
      username: string;
      password: string;
      website: string | null;
      notes: string | null;
      category: string;
      isFavorite: number;
      createdAt: string;
      updatedAt: string;
    }>('SELECT * FROM passwords ORDER BY updatedAt DESC');
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      username: row.username,
      password: row.password,
      website: row.website || undefined,
      notes: row.notes || undefined,
      category: row.category,
      isFavorite: row.isFavorite === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Update an existing password
const updatePassword = async (password: PasswordEntry): Promise<void> => {
  const { id, title, username, password: pass, website, notes, category, isFavorite, updatedAt } = password;
  try {
    await db.runAsync(
      `UPDATE passwords 
       SET title = ?, username = ?, password = ?, 
           website = ?, notes = ?, category = ?, 
           isFavorite = ?, updatedAt = ?
       WHERE id = ?`,
      [title, username, pass, website || null, notes || null, category, isFavorite ? 1 : 0, updatedAt.toISOString(), id]
    );
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Delete a password
const deletePassword = async (id: string): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM passwords WHERE id = ?', [id]);
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Get a single password by ID
const getPasswordById = async (id: string): Promise<PasswordEntry | null> => {
  try {
    const row = await db.getFirstAsync<{
      id: string;
      title: string;
      username: string;
      password: string;
      website: string | null;
      notes: string | null;
      category: string;
      isFavorite: number;
      createdAt: string;
      updatedAt: string;
    }>('SELECT * FROM passwords WHERE id = ?', [id]);
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      title: row.title,
      username: row.username,
      password: row.password,
      website: row.website || undefined,
      notes: row.notes || undefined,
      category: row.category,
      isFavorite: row.isFavorite === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export {
  initDatabase,
  initializeDatabaseSafely,
  savePassword,
  getAllPasswords,
  updatePassword,
  deletePassword,
  getPasswordById,
  exportDatabaseFile,
  testDatabasePersistence,
};