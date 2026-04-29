const { app, BrowserWindow, ipcMain, session } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const Store = require('electron-store');
const { initDatabase } = require('./ipc-handlers/connections');
const { setupConnectionHandlers } = require('./ipc-handlers/connections');
const { setupQueryHandlers } = require('./ipc-handlers/query');
const { setupMetadataHandlers } = require('./ipc-handlers/metadata');
const { setupPostgresHandlers, initPostgresData, stopPostgresServer } = require('./ipc-handlers/postgres-server');
const { setupMysqlHandlers, initMysqlData, stopMysqlServer } = require('./ipc-handlers/mysql-server');

// Initialize secure store for sensitive data
Store.initRenderer();

let mainWindow;
const isDev = !app.isPackaged;

function getAppIconPath() {
  const iconName = 'Postgres Manager Logo with Elephant Icon.png';
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(app.getAppPath(), 'resources', iconName);
  } else {
    iconPath = path.join(__dirname, '../../resources', iconName);
  }
  console.log('App icon path:', iconPath);
  fs.access(iconPath).catch((err) => {
    console.warn(`App icon missing: ${iconPath}`, err.message);
  });
  return iconPath;
}

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
    icon: getAppIconPath(),
    titleBarStyle: 'hiddenInset',
    show: false,
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
  await initDatabase();
  setupConnectionHandlers(ipcMain);
  setupQueryHandlers(ipcMain);
  setupMetadataHandlers(ipcMain);
  setupPostgresHandlers(ipcMain);
  setupMysqlHandlers(ipcMain);

  // Initialize bundled database servers
  try {
    console.log('Initializing bundled database servers...');

    // Try to initialize PostgreSQL
    try {
      await initPostgresData();
      console.log('✓ PostgreSQL initialized');
    } catch (err) {
      console.warn('PostgreSQL initialization skipped:', err.message);
    }

    // Try to initialize MySQL
    try {
      await initMysqlData();
      console.log('✓ MySQL initialized');
    } catch (err) {
      console.warn('MySQL initialization skipped:', err.message);
    }
  } catch (err) {
    console.error('Failed to initialize database servers:', err.message);
    // Continue anyway - user might have databases installed externally
  }

  createWindow();

  app.on('will-quit', async () => {
    try {
      // Stop both database servers
      await stopPostgresServer();
      await stopMysqlServer();

      const { cleanupAllPools } = require('./ipc-handlers/connection-manager');
      await cleanupAllPools();
    } catch (e) {
      console.log('Cleanup failed:', e.message);
    }
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

app.disableHardwareAcceleration();
