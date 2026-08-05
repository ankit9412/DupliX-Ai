# DupliX AI 🚀

A modern, high-performance desktop application for intelligently discovering and cleaning up duplicate files, visually similar images, and recovering wasted disk space. Built with React, Vite, Tailwind CSS, and Electron.

## Features

*   **Fast Scanning Engine:** Multi-threaded backend using Node.js Worker Threads to compute SHA-256 hashes without blocking the UI.
*   **Exact Duplicate Detection:** Finds exact 1:1 byte-for-byte identical files across your drives.
*   **Perceptual Image Hashing (pHash):** Groups visually similar images (e.g., resized, watermarked, or slightly cropped photos) together using Hamming Distance comparisons.
*   **Smart Settings & Filters:** Automatically skip system directories (like `Windows`, `node_modules`) and specific file extensions (like `.js`, `.css`) to speed up scans and keep your results clean.
*   **Sleek UI Dashboard:** Beautiful, dark-mode native React user interface built with Tailwind CSS and Lucide Icons.
*   **SQLite Database:** Scans and hashes are securely saved in a local SQLite database for blazing-fast retrieval and caching.

## Tech Stack

*   **Frontend:** React 19, Vite, Tailwind CSS v4, Zustand
*   **Backend:** Electron, Node.js (Worker Threads), `better-sqlite3`, `sharp` (for image hashing)
*   **Tooling:** `tsup` for compiling Electron scripts, `electron-builder` for packaging.

## Getting Started

### Prerequisites

You will need **Node.js 18+** installed on your machine.

### Installation

1. Clone the repository and navigate into the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

To run the app locally in development mode (with hot-reloading for the React UI):

```bash
npm run dev
```

### Packaging & Distribution

To compile the application into a distributable Windows installer (`.exe`):

```bash
npm run package
```

*Note: The generated installer will be located in the `release/` directory.*

## Architecture Notes

*   **`src/main/main.js`**: The main Electron backend process. Manages window creation, SQLite initialization, and IPC (Inter-Process Communication) handlers.
*   **`src/main/scanner.js`**: Core scanning service. Handles recursive directory walking, filtering based on user settings, and batch-processing files.
*   **`src/main/worker.js`**: Background Node.js worker thread. Calculates SHA-256 and Perceptual hashes off the main thread for performance.
*   **`src/main/database.js`**: SQLite configuration and schema.
*   **`src/preload/preload.js`**: Context bridge exposing secure APIs from Electron to the React frontend.
*   **`src/App.jsx`**: Main React layout, tabs, and routing.

## License

MIT
