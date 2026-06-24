import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { Worker } from 'worker_threads';
import { getDb } from './database.js';
import os from 'os';

const numCPUs = os.cpus().length;

export class ScannerService {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.workers = [];
    this.jobQueue = [];
    this.activeJobs = new Map();
    this.isScanning = false;
    this.scanId = null;
    this.filesDiscovered = 0;
    this.filesHashed = 0;
    this.totalToHash = 0;
    
    // Initialize workers
    const workerPath = path.join(__dirname, 'worker.cjs');
    for (let i = 0; i < Math.max(1, numCPUs - 1); i++) {
      const worker = new Worker(workerPath);
      worker.on('message', this.handleWorkerMessage.bind(this));
      worker.on('error', (err) => console.error('Worker error:', err));
      worker.isBusy = false;
      this.workers.push(worker);
    }
  }

  async startScan(dirPaths) {
    this.isScanning = true;
    this.scanId = crypto.randomUUID();
    this.filesDiscovered = 0;
    this.filesHashed = 0;
    this.totalToHash = 0;

    const db = getDb();
    
    // Load Settings
    try {
      this.excludedDirs = JSON.parse(db.prepare(`SELECT value FROM settings WHERE key = 'excludedDirs'`).get().value);
      this.excludedExts = JSON.parse(db.prepare(`SELECT value FROM settings WHERE key = 'excludedExtensions'`).get().value);
    } catch(e) {
      this.excludedDirs = [];
      this.excludedExts = [];
    }

    db.prepare(`INSERT INTO scans (id, startedAt, status, scannedPaths) VALUES (?, ?, ?, ?)`).run(
      this.scanId, Date.now(), 'running', JSON.stringify(dirPaths)
    );

    this.mainWindow.webContents.send('scan-progress', { stage: 'discovery', scanned: 0, total: 0 });

    // PHASE 1: Discover all files and insert basic metadata into DB
    for (const dirPath of dirPaths) {
      await this.walkDir(dirPath);
    }

    if (!this.isScanning) return;

    // PHASE 2: Filter by size
    this.mainWindow.webContents.send('scan-progress', { stage: 'filtering', scanned: this.filesDiscovered, total: this.filesDiscovered });
    
    // Find files that share the exact same size
    const duplicateSizeRows = db.prepare(`
      SELECT id, path, name FROM files 
      WHERE size IN (
        SELECT size FROM files WHERE scanId = ? AND size > 0 GROUP BY size HAVING COUNT(size) > 1
      ) AND scanId = ?
    `).all(this.scanId, this.scanId);

    this.totalToHash = duplicateSizeRows.length;
    
    if (this.totalToHash === 0) {
      this.finishScan();
      return;
    }

    // PHASE 3: Hash matching files
    this.mainWindow.webContents.send('scan-progress', { stage: 'hashing', scanned: 0, total: this.totalToHash });
    
    for (const row of duplicateSizeRows) {
       this.jobQueue.push({ id: row.id, filePath: row.path, fileName: row.name });
    }

    this.dispatchJobs();
  }

  async walkDir(dir) {
    if (!this.isScanning) return;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!this.isScanning) break;
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check excluded dirs
          if (!entry.name.startsWith('.') && !this.excludedDirs.includes(entry.name)) {
             await this.walkDir(fullPath);
          }
        } else if (entry.isFile()) {
           const ext = path.extname(entry.name).toLowerCase();
           if (this.excludedExts.includes(ext)) {
             continue; // Skip excluded extensions
           }
           
           try {
             const stat = await fs.stat(fullPath);
             const ext = path.extname(fullPath).toLowerCase();
             const db = getDb();
             
             db.prepare(`
               INSERT INTO files (id, scanId, path, name, extension, size, createdDate, modifiedDate, isDirectory)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
             `).run(crypto.randomUUID(), this.scanId, fullPath, entry.name, ext, stat.size, stat.birthtimeMs, stat.mtimeMs);
             
             this.filesDiscovered++;
             
             if (this.filesDiscovered % 1000 === 0) {
               this.mainWindow.webContents.send('scan-progress', { stage: 'discovery', scanned: this.filesDiscovered, total: this.filesDiscovered });
             }
           } catch(e) {
             // File read error (permissions, locked, etc)
           }
        }
      }
    } catch (err) {
      // Directory read error
    }
  }

  dispatchJobs() {
    if (!this.isScanning) return;
    
    while (this.jobQueue.length > 0) {
      const availableWorker = this.workers.find(w => !w.isBusy);
      if (!availableWorker) break; // All workers busy

      const job = this.jobQueue.shift();
      this.activeJobs.set(job.id, job);
      availableWorker.isBusy = true;
      availableWorker.currentJobId = job.id;
      availableWorker.postMessage({ id: job.id, filePath: job.filePath });
    }
    
    if (this.jobQueue.length === 0 && this.activeJobs.size === 0) {
       this.finishScan();
    }
  }

  async handleWorkerMessage(msg) {
    const job = this.activeJobs.get(msg.id);
    if (!job) return;
    this.activeJobs.delete(msg.id);
    
    const worker = this.workers.find(w => w.currentJobId === msg.id);
    if (worker) {
      worker.isBusy = false;
      worker.currentJobId = null;
    }

    if (!msg.error && msg.sha256) {
       try {
         const db = getDb();
         db.prepare(`UPDATE files SET hash = ?, phash = ? WHERE id = ?`)
           .run(msg.sha256, msg.phash || null, job.id);
           
         this.filesHashed++;
         
         if (this.filesHashed % 10 === 0) {
           this.mainWindow.webContents.send('scan-progress', { stage: 'hashing', scanned: this.filesHashed, total: this.totalToHash });
         }
       } catch (err) {
          console.error("DB update error", err);
       }
    }

    this.dispatchJobs();
  }

  finishScan() {
    this.isScanning = false;
    const db = getDb();
    
    // Group exactly by hash where count > 1
    db.exec(`
      UPDATE files SET duplicateGroupId = hash
      WHERE hash IN (
        SELECT hash FROM files WHERE scanId = '${this.scanId}' AND hash IS NOT NULL GROUP BY hash HAVING COUNT(hash) > 1
      ) AND scanId = '${this.scanId}';
    `);

    db.prepare(`UPDATE scans SET status = 'completed', completedAt = ?, totalFiles = ? WHERE id = ?`)
      .run(Date.now(), this.filesDiscovered, this.scanId);
      
    this.mainWindow.webContents.send('scan-progress', { stage: 'completed', scanned: this.filesHashed, total: this.totalToHash });
    this.mainWindow.webContents.send('scan-complete', { scanId: this.scanId, filesScanned: this.filesDiscovered, hashed: this.filesHashed });
  }

  stopScan() {
    this.isScanning = false;
    this.jobQueue = [];
  }
}
