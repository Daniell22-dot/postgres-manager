const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { initDatabase } = require('./ipc-handlers/connections');
const { setupConnectionHandlers } = require('./ipc-handlers/connections');
const { setupQueryHandlers } = require('./ipc-handlers/query');
const { setupMetadataHandlers } = require('./ipc-handlers/metadata');

// Initialize secure store for sensitive data
Store.initRenderer();

let mainWindow;
const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    icon: path.join(__dirname, '../../resources/icon.png'),
    titleBarStyle: 'hiddenInset', // Modern look on Mac
    show: false, // Show after ready
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Initialize local SQLite database for storing connections/history
  await initDatabase();
  
  // Setup IPC handlers
  setupConnectionHandlers(ipcMain);
  setupQueryHandlers(ipcMain);
  setupMetadataHandlers(ipcMain);
  
  createWindow();
  
  // Clear connection pools on app quit
  app.on('will-quit', async () => {
    const { cleanupAllPools } = require('./ipc-handlers/connection-manager');
    await cleanupAllPools();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Disable GPU acceleration if issues arise
app.disableHardwareAcceleration();