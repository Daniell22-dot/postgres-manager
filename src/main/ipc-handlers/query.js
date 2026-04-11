const { manager } = require('./connection-manager');
const Store = require('electron-store');

const store = new Store({
  name: 'postgres-manager-data'
});

function setupQueryHandlers(ipcMain) {
  // Execute query
  ipcMain.handle('db:executeQuery', async (event, connectionId, database, sql, params = []) => {
    const startTime = Date.now();
    
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
      
      // Execute query
      const result = await client.query(sql, params);
      
      const duration = Date.now() - startTime;
      
      // Save to history
      await saveQueryHistory(connectionId, sql, duration, result.rowCount);
      
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
      await saveQueryHistory(connectionId, sql, duration, 0, error.message);
      
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
    const history = store.get('queryHistory', []);
    const filtered = history
      .filter(h => h.connection_id === connectionId)
      .sort((a, b) => b.executed_at - a.executed_at)
      .slice(0, limit);
    
    return filtered;
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

async function saveQueryHistory(connectionId, sql, duration, rowCount, error = null) {
  const history = store.get('queryHistory', []);
  
  history.unshift({
    id: Date.now(),
    connection_id: connectionId,
    sql_text: sql,
    executed_at: Date.now(),
    duration_ms: duration,
    row_count: rowCount,
    error: error
  });
  
  // Keep only last 1000 records
  const trimmed = history.slice(0, 1000);
  store.set('queryHistory', trimmed);
}

async function getConnectionById(id) {
  const connections = store.get('connections', []);
  const connection = connections.find(c => String(c.id) === String(id));
  
  if (connection && connection.encrypted_password) {
    try {
      const crypto = require('crypto');
      const ENCRYPTION_KEY = crypto.scryptSync('postgres-manager-secret-v1', 'salt-pg-mgr', 32);
      const [ivHex, encryptedText] = connection.encrypted_password.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      connection.password = decrypted;
    } catch (err) {
      console.error('Failed to decrypt password during query execution', err.message);
      connection.password = '';
    }
  }
  
  return connection;
}

module.exports = { setupQueryHandlers };