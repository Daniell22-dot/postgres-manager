const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const { manager } = require('./connection-manager');
const { app } = require('electron');

let db;

// Encryption setup
const ENCRYPTION_KEY = crypto.randomBytes(32);
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  const [ivHex, encryptedText] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'postgres-manager.db');
  
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      host TEXT NOT NULL,
      port INTEGER DEFAULT 5432,
      database TEXT NOT NULL,
      username TEXT NOT NULL,
      encrypted_password TEXT,
      ssl_mode TEXT DEFAULT 'prefer',
      color TEXT,
      group_name TEXT,
      created_at INTEGER,
      last_connected INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS query_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER,
      sql_text TEXT NOT NULL,
      executed_at INTEGER,
      duration_ms INTEGER,
      row_count INTEGER,
      error TEXT,
      FOREIGN KEY(connection_id) REFERENCES connections(id)
    );
    
    CREATE TABLE IF NOT EXISTS saved_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER,
      name TEXT NOT NULL,
      sql_text TEXT NOT NULL,
      created_at INTEGER,
      last_executed INTEGER,
      favorite INTEGER DEFAULT 0,
      FOREIGN KEY(connection_id) REFERENCES connections(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_query_history_connection ON query_history(connection_id);
    CREATE INDEX IF NOT EXISTS idx_query_history_executed ON query_history(executed_at);
  `);
  
  console.log('Database initialized at:', dbPath);
}

function setupConnectionHandlers(ipcMain) {
  // Get all connections
  ipcMain.handle('db:getConnections', async () => {
    const stmt = db.prepare('SELECT * FROM connections ORDER BY name');
    const connections = stmt.all();
    
    // Decrypt passwords before sending
    return connections.map(conn => ({
      ...conn,
      password: conn.encrypted_password ? decrypt(conn.encrypted_password) : '',
      encrypted_password: undefined
    }));
  });
  
  // Save connection
  ipcMain.handle('db:saveConnection', async (event, connection) => {
    const encryptedPassword = connection.password ? encrypt(connection.password) : '';
    const now = Date.now();
    
    if (connection.id) {
      // Update existing
      const stmt = db.prepare(`
        UPDATE connections 
        SET name = ?, host = ?, port = ?, database = ?, username = ?, 
            encrypted_password = ?, ssl_mode = ?, color = ?, group_name = ?
        WHERE id = ?
      `);
      stmt.run(
        connection.name, connection.host, connection.port, connection.database,
        connection.username, encryptedPassword, connection.ssl_mode || 'prefer',
        connection.color || '', connection.group_name || '', connection.id
      );
    } else {
      // Insert new
      const stmt = db.prepare(`
        INSERT INTO connections (name, host, port, database, username, encrypted_password, 
                                 ssl_mode, color, group_name, created_at, last_connected)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        connection.name, connection.host, connection.port, connection.database,
        connection.username, encryptedPassword, connection.ssl_mode || 'prefer',
        connection.color || '', connection.group_name || '', now, null
      );
    }
    
    return { success: true };
  });
  
  // Delete connection
  ipcMain.handle('db:deleteConnection', async (event, id) => {
    const stmt = db.prepare('DELETE FROM connections WHERE id = ?');
    stmt.run(id);
    
    // Also delete related history
    const historyStmt = db.prepare('DELETE FROM query_history WHERE connection_id = ?');
    historyStmt.run(id);
    
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
        database: config.database,
        user: config.username,
        password: config.password,
        connectionTimeoutMillis: 5000,
      });
      
      const client = await testPool.connect();
      const result = await client.query('SELECT version() as version, NOW() as time');
      client.release();
      await testPool.end();
      
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
      if (testPool) await testPool.end();
    }
  });
}

module.exports = { initDatabase, setupConnectionHandlers };