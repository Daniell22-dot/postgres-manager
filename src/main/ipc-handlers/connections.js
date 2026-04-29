const Store = require('electron-store');
const crypto = require('crypto');
const { manager } = require('./connection-manager');
const { APIGateway } = require('../services/apiGateway');

const apiGateway = new APIGateway();

// Initialize store
const store = new Store({
  name: 'postgres-manager-data',
  defaults: {
    connections: [],
    queryHistory: [],
    savedQueries: []
  }
});

// Deterministic encryption key — same across restarts so saved passwords can be decrypted
const ENCRYPTION_KEY = crypto.scryptSync('postgres-manager-secret-v1', 'salt-pg-mgr', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  if (!text) return '';
  try {
    const [ivHex, encryptedText] = text.split(':');
    if (!ivHex || !encryptedText) return '';
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Password was encrypted with a different key (e.g. old random key) — return empty
    return '';
  }
}

async function getConnectionById(id) {
  const connections = store.get('connections', []);
  const connection = connections.find(c => String(c.id) === String(id));

  if (!connection) {
    return null;
  }

  return {
    ...connection,
    password: connection.encrypted_password ? decrypt(connection.encrypted_password) : '',
  };
}

async function initDatabase() {
  console.log('Storage initialized using electron-store');
  return true;
}

function setupConnectionHandlers(ipcMain) {
  // Get all connections
  ipcMain.handle('db:getConnections', async () => {
    const connections = store.get('connections', []);
    // Decrypt passwords
    return connections.map(conn => ({
      ...conn,
      password: conn.encrypted_password ? decrypt(conn.encrypted_password) : '',
      encrypted_password: undefined
    }));
  });
  
  // Save connection
  ipcMain.handle('db:saveConnection', async (event, connection) => {
    const connections = store.get('connections', []);
    const encryptedPassword = connection.password ? encrypt(connection.password) : '';
    const now = Date.now();
    
    if (connection.id) {
      // Update existing
      const index = connections.findIndex(c => c.id === connection.id);
      if (index !== -1) {
        connections[index] = {
          ...connection,
          encrypted_password: encryptedPassword,
          updated_at: now
        };
        store.set('connections', connections);
      }
    } else {
      // Insert new
      const newConnection = {
        id: Date.now(),
        ...connection,
        encrypted_password: encryptedPassword,
        created_at: now,
        last_connected: null
      };
      connections.push(newConnection);
      store.set('connections', connections);
    }
    
    return { success: true };
  });
  
  // Delete connection
  ipcMain.handle('db:deleteConnection', async (event, id) => {
    let connections = store.get('connections', []);
    connections = connections.filter(c => c.id !== id);
    store.set('connections', connections);
    
    // Also delete related history
    const history = store.get('queryHistory', []);
    const filteredHistory = history.filter(h => h.connection_id !== id);
    store.set('queryHistory', filteredHistory);
    
    // Clean up connection pool
    await manager.cleanupAllPools();
    
    return { success: true };
  });
  
  // Test connection
  ipcMain.handle('db:testConnection', async (event, config) => {
    const { Pool } = require('pg');
    let testPool;
    
    try {
      testPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database || 'postgres',
        user: config.username,
        password: config.password,
        connectionTimeoutMillis: 8000,
        max: 1,sopus
      });
      
      const client = await testPool.connect();
      const result = await client.query('SELECT version() as version, NOW() as time');
      client.release();
      
      return {
        success: true,
        version: result.rows[0].version,
        serverTime: result.rows[0].time
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      // Only call end once — in finally block
      if (testPool) {
        try { await testPool.end(); } catch (_) {}
      }
    }
  });

  ipcMain.handle('db:startApi', async (event, connectionId) => {
    try {
      const connectionConfig = await getConnectionById(connectionId);
      if (!connectionConfig) {
        throw new Error('Connection not found');
      }
      return await apiGateway.startForConnection(connectionId, connectionConfig);
    } catch (e) {
      throw new Error('Failed to start PostgREST API: ' + e.message);
    }
  });

  ipcMain.handle('db:stopApi', async (event, connectionId) => {
    try {
      await apiGateway.stop(connectionId);
      return { success: true };
    } catch (e) {
      throw new Error('Failed to stop API: ' + e.message);
    }
  });

// Add this to setupConnectionHandlers function
ipcMain.handle('db:createDatabase', async (event, connectionId, databaseName, owner, encoding) => {
  const connection = await getConnectionById(connectionId);
  if (!connection) {
    return { success: false, error: 'Connection not found' };
  }
  
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
    return { success: false, error: 'Invalid database name' };
  }

  if (owner && owner.trim() && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(owner.trim())) {
    return { success: false, error: 'Invalid owner name' };
  }

  const allowedEncodings = new Set(['UTF8', 'LATIN1', 'SQL_ASCII']);
  const normalizedEncoding = encoding || 'UTF8';
  if (!allowedEncodings.has(normalizedEncoding)) {
    return { success: false, error: 'Invalid encoding' };
  }
  
  const { Pool } = require('pg');
  let pool;
  let client;
  
  try {
    // Connect to default 'postgres' database to create new database
    pool = new Pool({
      host: connection.host,
      port: connection.port,
      database: 'postgres', // Connect to default database
      user: connection.username,
      password: connection.password,
      connectionTimeoutMillis: 10000,
    });
    
    client = await pool.connect();
    
    // Build CREATE DATABASE command
    let createSql = `CREATE DATABASE "${databaseName}"`;
    
    if (owner && owner.trim()) {
      createSql += ` OWNER = "${owner.trim()}"`;
    }
    
    createSql += ` ENCODING = '${normalizedEncoding}'`;
    
    console.log('Executing:', createSql);
    
    await client.query(createSql);
    
    return { success: true };
  } catch (error) {
    console.error('Error creating database:', error);
    return { success: false, error: error.message };
  } finally {
    if (client) client.release();
    if (pool) {
      try { await pool.end(); } catch (_) {}
    }
  }
});
}
module.exports = { initDatabase, setupConnectionHandlers };
