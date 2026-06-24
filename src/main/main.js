import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import crypto from 'crypto';
import { initDatabase, getDb } from './database.js';
import { ScannerService } from './scanner.js';

let mainWindow = null;
let scannerService = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc',
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  scannerService = new ScannerService(mainWindow);
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Basic IPC handlers
ipcMain.handle('ping', () => 'pong');

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections']
  });
  return result.filePaths;
});

ipcMain.handle('start-scan', async (event, dirPaths) => {
  if (scannerService) {
    scannerService.startScan(dirPaths);
    return true;
  }
  return false;
});

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return true;
  } catch (err) {
    console.error('Failed to open file', err);
    return false;
  }
});

ipcMain.handle('get-duplicates', async (event, scanId) => {
  const db = getDb();
  // Fetch files that are marked as part of a duplicate group
  const rows = db.prepare(`
    SELECT * FROM files 
    WHERE scanId = ? AND duplicateGroupId IS NOT NULL 
    ORDER BY duplicateGroupId, size DESC
  `).all(scanId);
  return rows;
});

ipcMain.handle('get-settings', async () => {
  const db = getDb();
  const settings = {};
  const rows = db.prepare('SELECT * FROM settings').all();
  rows.forEach(r => settings[r.key] = JSON.parse(r.value));
  return settings;
});

ipcMain.handle('save-settings', async (event, settings) => {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, JSON.stringify(value));
    }
  });
  transaction();
  return true;
});

ipcMain.handle('get-similar-images', async (event, scanId) => {
  const db = getDb();
  // Fetch all images with a phash for this scan
  const rows = db.prepare(`
    SELECT * FROM files 
    WHERE scanId = ? AND phash IS NOT NULL AND size > 0
  `).all(scanId);

  // Grouping logic based on hamming distance
  const groups = [];
  const processed = new Set();
  
  function hammingDistance(str1, str2) {
    let dist = 0;
    for (let i = 0; i < str1.length; i++) {
      if (str1[i] !== str2[i]) dist++;
    }
    return dist;
  }

  for (let i = 0; i < rows.length; i++) {
    if (processed.has(rows[i].id)) continue;
    
    const currentGroup = [rows[i]];
    processed.add(rows[i].id);

    for (let j = i + 1; j < rows.length; j++) {
      if (processed.has(rows[j].id)) continue;
      
      const dist = hammingDistance(rows[i].phash, rows[j].phash);
      if (dist <= 5) { // Threshold for similarity
        currentGroup.push(rows[j]);
        processed.add(rows[j].id);
      }
    }
    
    if (currentGroup.length > 1) {
      groups.push({
        id: crypto.randomUUID(),
        files: currentGroup,
        wastedSpace: currentGroup.reduce((sum, f) => sum + f.size, 0) - currentGroup[0].size
      });
    }
  }

  return groups;
});

