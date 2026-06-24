import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs-extra';

let db;

export function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  
  // Ensure the directory exists
  fs.ensureDirSync(dbDir);
  
  const dbPath = path.join(dbDir, 'duplix.db');
  db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });

  // Initialize schema
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      startedAt INTEGER NOT NULL,
      completedAt INTEGER,
      status TEXT NOT NULL,
      totalFiles INTEGER DEFAULT 0,
      scannedPaths TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      scanId TEXT NOT NULL,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      extension TEXT NOT NULL,
      size INTEGER NOT NULL,
      createdDate INTEGER NOT NULL,
      modifiedDate INTEGER NOT NULL,
      isDirectory INTEGER NOT NULL,
      hash TEXT,
      phash TEXT,
      duplicateGroupId TEXT,
      FOREIGN KEY(scanId) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
    CREATE INDEX IF NOT EXISTS idx_files_scanId ON files(scanId);
    CREATE INDEX IF NOT EXISTS idx_files_duplicateGroupId ON files(duplicateGroupId);
  `);

  // Initialize default settings if missing
  const defaultExcludedExts = JSON.stringify(['.css', '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.md', '.dll', '.exe', '.sys', '.ini']);
  const defaultExcludedDirs = JSON.stringify(['node_modules', '.git', 'build', 'dist', 'Windows', 'System32', 'Program Files', 'Program Files (x86)', 'AppData']);

  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('excludedExtensions', ?)`).run(defaultExcludedExts);
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('excludedDirs', ?)`).run(defaultExcludedDirs);

  console.log(`Database initialized at: ${dbPath}`);
}

export function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized.');
  }
  return db;
}
