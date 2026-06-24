import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/main/main.js', 'src/main/worker.js'],
    outDir: 'dist-electron',
    format: ['cjs'],
    target: 'node18',
    external: ['electron', 'better-sqlite3', 'ffmpeg-static', 'ffprobe-static', 'fluent-ffmpeg', 'sharp'],
    clean: true,
  },
  {
    entry: ['src/preload/preload.js'],
    outDir: 'dist-electron',
    format: ['cjs'],
    target: 'node18',
    external: ['electron'],
    clean: false,
  }
]);
