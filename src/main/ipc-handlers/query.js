const { manager } = require('./connection-manager');
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let historyDb;

function getHistoryDb() {
  if (!historyDb) {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'postgres-manager.db');
    historyDb = new Database(dbPath);
  }
  return historyDb;
}

function setupQueryHandlers(ipcMain) {
  // Execute query
  ipcMain.handle('db:executeQuery', async (event, connectionId, database, sql, params = []) => {
    const startTime = Date.now();
    const queryId = Math.random().toString(36).substring(7);
    
    // Get connection config
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    const dbConfig = { ...connection, database };
    const poolKey = `${connectionId}-${database}`;
    
    let client;
    try {
      const pool = await manager.getPool(poolKey, dbConfig);
      client = await pool.connect();
      
      // Set up query timeout (60 seconds)
      const timeout = setTimeout(() => {
        manager.cancelQuery(queryId);
      }, 60000);
      
      // Execute query
      const result = await client.query(sql, params);
      
      clearTimeout(timeout);
      
      const duration = Date.now() - startTime;
      
      // Save to history
      saveQueryHistory(connectionId, sql, duration, result.rowCount);
      
      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields,
        duration,
        command: result.command
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      saveQueryHistory(connectionId, sql, duration, 0, error.message);
      
      return {
        success: false,
        error: error.message,
        duration
      };
    } finally {
      if (client) client.release();
    }
  });
  
  // Get query history
  ipcMain.handle('db:getQueryHistory', async (event, connectionId, limit = 100) => {
    const db = getHistoryDb();
    const stmt = db.prepare(`
      SELECT * FROM query_history 
      WHERE connection_id = ? 
      ORDER BY executed_at DESC 
      LIMIT ?
    `);
    return stmt.all(connectionId, limit);
  });
  
  // Export to CSV
  ipcMain.handle('db:exportToCSV', async (event, data, filename) => {
    const { dialog } = require('electron');
    const fs = require('fs');
    
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `${filename}.csv`,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    
    if (!filePath) return { success: false };
    
    // Convert to CSV
    if (data.length === 0) {
      fs.writeFileSync(filePath, '');
      return { success: true, filePath };
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return String(value).replace(/,/g, ';');
      });
      csvRows.push(values.join(','));
    }
    
    fs.writeFileSync(filePath, csvRows.join('\n'));
    return { success: true, filePath };
  });
}

function saveQueryHistory(connectionId, sql, duration, rowCount, error = null) {
  const db = getHistoryDb();
  const stmt = db.prepare(`
    INSERT INTO query_history (connection_id, sql_text, executed_at, duration_ms, row_count, error)
    VALUES (?, ?, ?, ?, ?, ?) 
  `);// Save query execution details to history.
  
  stmt.run(connectionId, sql, Date.now(), duration, rowCount, error);
  
  // Keep only last 1000 records per connection
  db.prepare(`
    DELETE FROM query_history 
    WHERE id NOT IN (
      SELECT id FROM query_history 
      WHERE connection_id = ? 
      ORDER BY executed_at DESC 
      LIMIT 1000
    )
  `).run(connectionId);
}

async function getConnectionById(id) {
  const Database = require('better-sqlite3');
  const path = require('path');
  const { app } = require('electron');
  const crypto = require('crypto');
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'postgres-manager.db');
  const db = new Database(dbPath);
  
  const stmt = db.prepare('SELECT * FROM connections WHERE id = ?');
  const connection = stmt.get(id);
  
  if (connection && connection.encrypted_password) {
    const [ivHex, encryptedText] = connection.encrypted_password.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from('01234567890123456789012345678901'), iv); // Use a fixed key for decryption (should match encryption key)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    connection.password = decrypted;
  }
// Decrypt password and add to connection object

  db.close();
  return connection;
}

module.exports = { setupQueryHandlers };