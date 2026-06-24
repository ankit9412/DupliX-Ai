import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  startScan: (dirPaths) => ipcRenderer.invoke('start-scan', dirPaths),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getDuplicates: (scanId) => ipcRenderer.invoke('get-duplicates', scanId),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSimilarImages: (scanId) => ipcRenderer.invoke('get-similar-images', scanId),
  onScanProgress: (callback) => ipcRenderer.on('scan-progress', (event, data) => callback(data)),
  onScanComplete: (callback) => ipcRenderer.on('scan-complete', (event, data) => callback(data)),
});
