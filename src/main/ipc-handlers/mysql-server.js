const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const Store = require('electron-store');
const os = require('os');

const store = new Store();

let mysqlServerProcess = null;
let mysqlDataDir = null;

// Get MySQL binaries path
function getMysqlBinPath() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    // When app is packaged
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, '..', 'resources', 'binaries', 'mysql', 'bin');
  } else {
    // Development
    return path.join(__dirname, '../../resources/binaries/mysql/bin');
  }
}

// Get MySQL data directory (in user's appData)
function getMysqlDataDir() {
  const appDataDir = path.join(os.homedir(), 'AppData', 'Local', 'PostgresManager');
  return path.join(appDataDir, 'mysqldata');
}

// Initialize MySQL data directory on first run
async function initMysqlData() {
  mysqlDataDir = getMysqlDataDir();

  try {
    // Create directories if they don't exist
    await fs.mkdir(mysqlDataDir, { recursive: true });

    // Check if already initialized
    const mysqlInitFile = path.join(mysqlDataDir, 'mysql.ibd');
    const exists = await fs.access(mysqlInitFile).then(() => true).catch(() => false);

    if (exists) {
      console.log('MySQL data directory already initialized');
      return true;
    }

    console.log('Initializing MySQL data directory:', mysqlDataDir);

    const mysqldPath = path.join(getMysqlBinPath(), 'mysqld.exe');

    return new Promise((resolve, reject) => {
      const mysqld = spawn(mysqldPath, [
        `--initialize-insecure`,
        `--datadir=${mysqlDataDir}`,
        `--user=root`
      ], {
        stdio: 'pipe'
      });

      let output = '';

      mysqld.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[mysqld init]', data.toString());
      });

      mysqld.stderr.on('data', (data) => {
        output += data.toString();
        console.log('[mysqld init error]', data.toString());
      });

      mysqld.on('close', (code) => {
        if (code === 0) {
          console.log('MySQL initialized successfully');
          resolve(true);
        } else {
          console.error('MySQL initialization failed:', output);
          reject(new Error(`mysqld initialization failed with code ${code}`));
        }
      });

      mysqld.on('error', (err) => {
        console.error('Failed to start mysqld:', err);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Error initializing MySQL:', err);
    throw err;
  }
}

// Start MySQL server
async function startMysqlServer() {
  try {
    if (mysqlServerProcess) {
      console.log('MySQL server already running');
      return { success: true, message: 'Server already running' };
    }

    mysqlDataDir = getMysqlDataDir();
    const mysqldPath = path.join(getMysqlBinPath(), 'mysqld.exe');

    console.log('Starting MySQL server...');
    console.log('Binary:', mysqldPath);
    console.log('Data dir:', mysqlDataDir);

    return new Promise((resolve) => {
      mysqlServerProcess = spawn(mysqldPath, [
        `--datadir=${mysqlDataDir}`,
        `--port=3306`,
        `--bind-address=127.0.0.1`
      ], {
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      mysqlServerProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[mysqld]', data.toString());
      });

      mysqlServerProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('[mysqld error]', data.toString());
      });

      mysqlServerProcess.on('close', (code) => {
        if (code === 0) {
          console.log('MySQL server started successfully');
          resolve({
            success: true,
            message: 'MySQL server started'
          });
        } else {
          mysqlServerProcess = null;
          console.error('MySQL failed to start:', errorOutput);
          resolve({
            success: false,
            error: errorOutput || output
          });
        }
      });

      mysqlServerProcess.on('error', (err) => {
        mysqlServerProcess = null;
        console.error('Failed to start MySQL:', err);
        resolve({
          success: false,
          error: err.message
        });
      });

      // Give it a few seconds to start
      setTimeout(() => {
        resolve({
          success: true,
          message: 'MySQL server starting...'
        });
      }, 2000);
    });
  } catch (err) {
    console.error('Error starting MySQL server:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Stop MySQL server
async function stopMysqlServer() {
  try {
    if (!mysqlServerProcess) {
      console.log('MySQL server not running');
      return { success: true, message: 'Server not running' };
    }

    mysqlDataDir = mysqlDataDir || getMysqlDataDir();
    const mysqladminPath = path.join(getMysqlBinPath(), 'mysqladmin.exe');

    console.log('Stopping MySQL server...');

    return new Promise((resolve) => {
      const stopProcess = spawn(mysqladminPath, [
        '-u', 'root',
        'shutdown'
      ]);

      let output = '';

      stopProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('[mysqladmin]', data.toString());
      });

      stopProcess.stderr.on('data', (data) => {
        console.log('[mysqladmin error]', data.toString());
      });

      stopProcess.on('close', (code) => {
        if (code === 0 || code === 1) {
          console.log('MySQL server stopped');
          mysqlServerProcess = null;
          resolve({ success: true, message: 'Server stopped' });
        } else {
          resolve({ success: true, message: 'Stop signal sent' });
        }
      });

      stopProcess.on('error', (err) => {
        console.error('Error stopping MySQL:', err);
        // Force kill if graceful shutdown fails
        if (mysqlServerProcess) {
          mysqlServerProcess.kill();
          mysqlServerProcess = null;
        }
        resolve({ success: true, message: 'Server stop initiated' });
      });

      setTimeout(() => {
        if (mysqlServerProcess) {
          mysqlServerProcess.kill();
          mysqlServerProcess = null;
        }
        resolve({ success: true, message: 'Stop signal sent' });
      }, 3000);
    });
  } catch (err) {
    console.error('Error stopping MySQL:', err);
    return { success: false, error: err.message };
  }
}

function setupMysqlHandlers(ipcMain) {
  // Initialize MySQL
  ipcMain.handle('mysql:init', async () => {
    try {
      await initMysqlData();
      const result = await startMysqlServer();
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Start server
  ipcMain.handle('mysql:start', async () => {
    return await startMysqlServer();
  });

  // Stop server
  ipcMain.handle('mysql:stop', async () => {
    return await stopMysqlServer();
  });

  // Get server status
  ipcMain.handle('mysql:status', async () => {
    return {
      running: mysqlServerProcess !== null,
      dataDir: getMysqlDataDir()
    };
  });
}

module.exports = {
  setupMysqlHandlers,
  startMysqlServer,
  stopMysqlServer,
  initMysqlData
};
