import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { PasswordEntry } from '../types/password';

// Database name
const DB_NAME = 'passwords.db';

// Get the database directory
const getDatabaseDirectory = async (): Promise<string> => {
  // In development, use a fixed location in the project directory
  const directory = FileSystem.documentDirectory + 'SQLite/';
  
  // Ensure the directory exists
  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    console.log('Created directory:', directory);
  } catch (error) {
    console.error('Error creating directory:', error);
  }
  
  return directory;
};

// Get the full database path
const getDatabasePath = async (): Promise<string> => {
  const directory = await getDatabaseDirectory();
  return directory + DB_NAME;
};

// Get database location for debugging
export const getDatabaseInfo = async (): Promise<{ name: string; directory: string; path: string }> => {
  const directory = await getDatabaseDirectory();
  const path = await getDatabasePath();
  const info = {
    name: DB_NAME,
    directory,
    path
  };
  
  // Check if file exists
  try {
    const fileInfo = await FileSystem.getInfoAsync(path);
    console.log('Database Location Info:', {
      ...info,
      platform: Platform.OS,
      documentDirectory: FileSystem.documentDirectory,
      cacheDirectory: FileSystem.cacheDirectory,
      exists: fileInfo.exists,
      isDirectory: fileInfo.isDirectory
    });
    
    // If the file doesn't exist in development, create an empty file
    if (!fileInfo.exists && __DEV__) {
      await FileSystem.writeAsStringAsync(path, '');
      console.log('Created empty database file at:', path);
    }
  } catch (error) {
    console.error('Error checking database file:', error);
  }
  
  return info;
};

// Export database file
const exportDatabaseFile = async (): Promise<string> => {
  try {
    // Close the database connection to ensure all changes are written
    await db.closeAsync();
    
    // Get current database path
    const dbPath = await getDatabasePath();
    console.log('Exporting database from:', dbPath);
    
    // Setup export path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFileName = `passwords-backup-${timestamp}.db`;
    const exportPath = FileSystem.cacheDirectory + exportFileName;
    console.log('Exporting database to:', exportPath);

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
      db = SQLite.openDatabaseSync(DB_NAME);
      createTables(db);
    }
    
    return exportPath;
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
};

// Initialize database schema
const createTables = (database: SQLite.SQLiteDatabase) => {
  try {
    database.execSync(`
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
    // Ensure directory exists
    const directory = await getDatabaseDirectory();
    console.log('Database directory ready:', directory);
    
    // Create/open database
    db = SQLite.openDatabaseSync(DB_NAME);
    console.log('Database opened successfully');
    
    // Initialize schema
    createTables(db);
    
    // Log database info
    const info = await getDatabaseInfo();
    console.log('Database fully initialized:', info);
    
    // Verify tables
    const tables = db.execSync("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Database tables:', tables);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Initialize the database
initializeDb().catch(error => {
  console.error('Failed to initialize database:', error);
});

// Initialize/reset the database if needed
const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Drop and recreate the table to reset it
      db.execSync('DROP TABLE IF EXISTS passwords');
      createTables(db);
      resolve();
    } catch (error: unknown) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

// Save a new password
const savePassword = async (password: PasswordEntry): Promise<void> => {
  const { id, title, username, password: pass, website, notes, category, isFavorite, createdAt, updatedAt } = password;
  try {
    const stmt = db.prepareSync(
      `INSERT INTO passwords (id, title, username, password, website, notes, category, isFavorite, createdAt, updatedAt)
       VALUES ($id, $title, $username, $password, $website, $notes, $category, $isFavorite, $createdAt, $updatedAt)`
    );
    try {
      stmt.executeSync({
        $id: id,
        $title: title,
        $username: username,
        $password: pass,
        $website: website || null,
        $notes: notes || null,
        $category: category,
        $isFavorite: isFavorite ? 1 : 0,
        $createdAt: createdAt.toISOString(),
        $updatedAt: updatedAt.toISOString()
      });
    } finally {
      stmt.finalizeSync();
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Get all passwords
const getAllPasswords = async (): Promise<PasswordEntry[]> => {
  try {
    const stmt = db.prepareSync('SELECT * FROM passwords ORDER BY updatedAt DESC');
    try {
      const result = stmt.executeSync<{
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
      }>();
      const rows = result.getAllSync();
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
    } finally {
      stmt.finalizeSync();
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Update an existing password
const updatePassword = async (password: PasswordEntry): Promise<void> => {
  const { id, title, username, password: pass, website, notes, category, isFavorite, updatedAt } = password;
  try {
    const stmt = db.prepareSync(
      `UPDATE passwords 
       SET title = $title, username = $username, password = $password, 
           website = $website, notes = $notes, category = $category, 
           isFavorite = $isFavorite, updatedAt = $updatedAt
       WHERE id = $id`
    );
    try {
      stmt.executeSync({
        $id: id,
        $title: title,
        $username: username,
        $password: pass,
        $website: website || null,
        $notes: notes || null,
        $category: category,
        $isFavorite: isFavorite ? 1 : 0,
        $updatedAt: updatedAt.toISOString()
      });
    } finally {
      stmt.finalizeSync();
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Delete a password
const deletePassword = async (id: string): Promise<void> => {
  try {
    const stmt = db.prepareSync('DELETE FROM passwords WHERE id = $id');
    try {
      stmt.executeSync({ $id: id });
    } finally {
      stmt.finalizeSync();
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

// Get a single password by ID
const getPasswordById = async (id: string): Promise<PasswordEntry | null> => {
  try {
    const stmt = db.prepareSync('SELECT * FROM passwords WHERE id = $id');
    try {
      const result = stmt.executeSync<{
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
      }>({ $id: id });
      const row = result.getFirstSync();
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
    } finally {
      stmt.finalizeSync();
    }
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export {
  initDatabase,
  savePassword,
  getAllPasswords,
  updatePassword,
  deletePassword,
  getPasswordById,
  exportDatabaseFile,
};