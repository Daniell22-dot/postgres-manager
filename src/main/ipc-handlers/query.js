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
    
    try {
      const pool = await manager.getPool(poolKey, dbConfig);

      if (pool.__type === 'mysql') {
        // MySQL query execution
        const [rows, fields] = await pool.execute(sql);

        const duration = Date.now() - startTime;

        // For SELECT-like queries, rows is an array of results
        // For INSERT/UPDATE/DELETE, rows is a ResultSetHeader
        const isResultSet = Array.isArray(rows);

        await saveQueryHistory(connectionId, sql, duration, isResultSet ? rows.length : (rows.affectedRows || 0));

        if (isResultSet) {
          return {
            success: true,
            rows: rows,
            rowCount: rows.length,
            fields: fields ? fields.map(f => ({
              name: f.name,
              dataTypeID: f.columnType,
              tableID: f.table,
            })) : [],
            duration,
            command: sql.trim().split(/\s+/)[0].toUpperCase()
          };
        } else {
          return {
            success: true,
            rows: [],
            rowCount: rows.affectedRows || 0,
            fields: [],
            duration,
            command: sql.trim().split(/\s+/)[0].toUpperCase()
          };
        }
      }

      // PostgreSQL query execution
      let client;
      try {
        client = await pool.connect();
        const result = await client.query(sql, params);

        const duration = Date.now() - startTime;
        await saveQueryHistory(connectionId, sql, duration, result.rowCount);

        return {
          success: true,
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields,
          duration,
          command: result.command
        };
      } finally {
        if (client) client.release();
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      await saveQueryHistory(connectionId, sql, duration, 0, error.message);
      
      return {
        success: false,
        error: error.message,
        duration
      };
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

  // Database Shell Commands
  ipcMain.handle('db:pgCommand', async (event, connectionId, database, cmd) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) throw new Error('Connection not found');

    const connType = connection.type || 'postgres';
    let binary, args, env;

    if (connType === 'mysql') {
      binary = 'mysql';
      args = [
        '-h', connection.host,
        '-P', connection.port.toString(),
        '-u', connection.username,
        '-D', database,
        '-e', cmd
      ];
      env = connection.password ? { MYSQL_PWD: connection.password } : {};
    } else {
      binary = 'psql';
      args = ['-c', cmd];
      if (cmd.startsWith('pg_dump')) {
        binary = 'pg_dump';
        args = ['--no-password', '-h', connection.host, '-p', connection.port.toString(), '-U', connection.username, '-d', database, ...cmd.split(' ').slice(1)];
      } else if (cmd.startsWith('pg_restore')) {
        binary = 'pg_restore';
        args = ['--no-password', '-h', connection.host, '-p', connection.port.toString(), '-U', connection.username, '-d', database, ...cmd.split(' ').slice(1)];
      }
      env = { PGPASSWORD: connection.password };
    }
    
    const { spawn } = require('child_process');
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      const child = spawn(binary, args, { env });
      
      child.stdout.on('data', (data) => stdout += data);
      child.stderr.on('data', (data) => stderr += data);
      
      child.on('close', (code) => resolve({ code, stdout, stderr, cmd }));
      child.on('error', (err) => resolve({ error: err.message, cmd }));
    });
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
  // Handle bundled local servers
  if (id === 'local-postgres') {
    return {
      id: 'local-postgres',
      name: 'PostgreSQL (Local)',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: '',
      type: 'postgres',
      isLocal: true,
    };
  }
  if (id === 'local-mysql') {
    return {
      id: 'local-mysql',
      name: 'MySQL (Local)',
      host: 'localhost',
      port: 3306,
      database: 'mysql',
      username: 'root',
      password: '',
      type: 'mysql',
      isLocal: true,
    };
  }

  const connections = store.get('connections', []);
  const connection = connections.find(c => String(c.id) === String(id));
  
  if (!connection) return null;
  
  if (connection.encrypted_password) {
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
      console.error('Failed to decrypt password:', err.message);
      connection.password = '';
    }
  }
  
  return connection;
}

module.exports = { setupQueryHandlers };
