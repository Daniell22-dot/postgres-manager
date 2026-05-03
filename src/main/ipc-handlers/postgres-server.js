const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const Store = require('electron-store');
const os = require('os');

const store = new Store();

let pgServerProcess = null;
let pgDataDir = null;

// Get PostgreSQL binaries path
function getPgBinPath() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    // When app is packaged
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, '..', 'resources', 'binaries', 'postgresql');
  } else {
    // Development: __dirname is src/main/ipc-handlers, go up 3 levels to project root
    return path.join(__dirname, '../../../resources/binaries/postgresql');
  }
}

// Get PostgreSQL data directory (in user's appData)
function getPgDataDir() {
  const appDataDir = path.join(os.homedir(), 'AppData', 'Local', 'PostgresManager');
  return path.join(appDataDir, 'pgdata');
}

// Initialize PostgreSQL data directory on first run
async function initPostgresData() {
  pgDataDir = getPgDataDir();

  try {
    // Create directories if they don't exist
    await fs.mkdir(pgDataDir, { recursive: true });

    // Check if already initialized
    const pgVersionFile = path.join(pgDataDir, 'PG_VERSION');
    const exists = await fs.access(pgVersionFile).then(() => true).catch(() => false);

    if (exists) {
      console.log('PostgreSQL data directory already initialized');
      return true;
    }

    console.log('Initializing PostgreSQL data directory:', pgDataDir);

    const initdbPath = path.join(getPgBinPath(), 'initdb.exe');

    return new Promise((resolve, reject) => {
      const initdb = spawn(initdbPath, ['-D', pgDataDir, '-U', 'postgres'], {
        stdio: 'pipe'
      });

      let output = '';

      initdb.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[initdb]', data.toString());
      });

      initdb.stderr.on('data', (data) => {
        output += data.toString();
        console.log('[initdb error]', data.toString());
      });

      initdb.on('close', (code) => {
        if (code === 0) {
          console.log('PostgreSQL initialized successfully');
          resolve(true);
        } else {
          console.error('PostgreSQL initialization failed:', output);
          reject(new Error(`initdb failed with code ${code}`));
        }
      });

      initdb.on('error', (err) => {
        console.error('Failed to start initdb:', err);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Error initializing PostgreSQL:', err);
    throw err;
  }
}

// Start PostgreSQL server
async function startPostgresServer() {
  try {
    if (pgServerProcess) {
      console.log('PostgreSQL server already running');
      return { success: true, message: 'Server already running' };
    }

    pgDataDir = getPgDataDir();
    const pgCtlPath = path.join(getPgBinPath(), 'pg_ctl.exe');

    console.log('Starting PostgreSQL server...');
    console.log('Binary:', pgCtlPath);
    console.log('Data dir:', pgDataDir);

    return new Promise((resolve) => {
      pgServerProcess = spawn(pgCtlPath, [
        'start',
        '-D', pgDataDir,
        '-l', path.join(pgDataDir, 'postgres.log')
      ]);

      let output = '';
      let errorOutput = '';

      pgServerProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[pg_ctl]', data.toString());
      });

      pgServerProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('[pg_ctl error]', data.toString());
      });

      pgServerProcess.on('close', (code) => {
        if (code === 0) {
          console.log('PostgreSQL server started successfully');
          resolve({
            success: true,
            message: 'PostgreSQL server started'
          });
        } else {
          pgServerProcess = null;
          console.error('PostgreSQL failed to start:', errorOutput);
          resolve({
            success: false,
            error: errorOutput || output
          });
        }
      });

      pgServerProcess.on('error', (err) => {
        pgServerProcess = null;
        console.error('Failed to start PostgreSQL:', err);
        resolve({
          success: false,
          error: err.message
        });
      });

      // Give it a few seconds to start
      setTimeout(() => {
        resolve({
          success: true,
          message: 'PostgreSQL server starting...'
        });
      }, 2000);
    });
  } catch (err) {
    console.error('Error starting PostgreSQL server:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Stop PostgreSQL server
async function stopPostgresServer() {
  try {
    pgDataDir = pgDataDir || getPgDataDir();
    const pgCtlPath = path.join(getPgBinPath(), 'pg_ctl.exe');

    console.log('Stopping PostgreSQL server...');

    return new Promise((resolve) => {
      const stopProcess = spawn(pgCtlPath, [
        'stop',
        '-D', pgDataDir,
        '-m', 'fast'
      ]);

      let output = '';

      stopProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[pg_ctl stop]', data.toString());
      });

      stopProcess.stderr.on('data', (data) => {
        console.log('[pg_ctl stop error]', data.toString());
      });

      stopProcess.on('close', (code) => {
        pgServerProcess = null;
        if (code === 0) {
          console.log('PostgreSQL server stopped');
          resolve({ success: true, message: 'Server stopped' });
        } else {
          // Code 3 usually means server wasn't running, which is ok
          resolve({ success: true, message: 'Server stop initiated' });
        }
      });

      stopProcess.on('error', (err) => {
        console.error('Error stopping PostgreSQL:', err);
        resolve({ success: true, message: 'Stop signal sent' });
      });

      setTimeout(() => {
        resolve({ success: true, message: 'Stop signal sent' });
      }, 3000);
    });
  } catch (err) {
    console.error('Error stopping PostgreSQL:', err);
    return { success: false, error: err.message };
  }
}

function setupPostgresHandlers(ipcMain) {
  // Initialize PostgreSQL
  ipcMain.handle('postgres:init', async () => {
    try {
      await initPostgresData();
      const result = await startPostgresServer();
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Start server
  ipcMain.handle('postgres:start', async () => {
    return await startPostgresServer();
  });

  // Stop server
  ipcMain.handle('postgres:stop', async () => {
    return await stopPostgresServer();
  });

  // Get server status
  ipcMain.handle('postgres:status', async () => {
    return {
      running: pgServerProcess !== null,
      dataDir: getPgDataDir()
    };
  });
}

module.exports = {
  setupPostgresHandlers,
  startPostgresServer,
  stopPostgresServer,
  initPostgresData
};
