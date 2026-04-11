const { manager } = require('./connection-manager');

function setupMetadataHandlers(ipcMain) {
  // Get databases (for PostgreSQL)
  ipcMain.handle('db:getDatabases', async (event, connectionId) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    try {
      const pool = await manager.getPool(connectionId, connection);
      const client = await pool.connect();
      
      // Get all databases (excluding templates)
      const result = await client.query(`
        SELECT datname as name 
        FROM pg_database 
        WHERE datistemplate = false 
        ORDER BY datname
      `);
      
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching databases:', error);
      return [];
    }
  });
  
  // Get schemas for a database
  ipcMain.handle('db:getSchemas', async (event, connectionId, database) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    // Create a new connection to the specific database
    const dbConfig = { ...connection, database };
    
    try {
      const pool = await manager.getPool(`${connectionId}-${database}`, dbConfig);
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT schema_name as name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schema_name
      `);
      
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching schemas:', error);
      return [];
    }
  });
  
  // Get tables in a schema
  ipcMain.handle('db:getTables', async (event, connectionId, database, schema) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    const dbConfig = { ...connection, database };
    
    try {
      const pool = await manager.getPool(`${connectionId}-${database}`, dbConfig);
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT 
          table_name as name,
          0 as estimated_rows,
          NULL as comment
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schema]);
      
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  });
  
  // Get columns for a table
  ipcMain.handle('db:getColumns', async (event, connectionId, database, schema, table) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    const dbConfig = { ...connection, database };
    
    try {
      const pool = await manager.getPool(`${connectionId}-${database}`, dbConfig);
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT 
          column_name as name,
          data_type as type,
          is_nullable = 'YES' as nullable,
          column_default as default_value,
          character_maximum_length as max_length
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, table]);
      
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching columns:', error);
      return [];
    }
  });
}

function getConnectionById(id) {
  const Store = require('electron-store');
  const crypto = require('crypto');

  const store = new Store({
    name: 'postgres-manager-data',
    defaults: { connections: [] }
  });

  const connections = store.get('connections', []);
  // id is stored as a number (Date.now()) but IPC may pass it as string
  const connection = connections.find(c => String(c.id) === String(id));
  if (!connection) return null;

  // Decrypt password using the same deterministic key as connections.js
  if (connection.encrypted_password) {
    try {
      const ENCRYPTION_KEY = crypto.scryptSync('postgres-manager-secret-v1', 'salt-pg-mgr', 32);
      const [ivHex, encryptedText] = connection.encrypted_password.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      connection.password = decrypted;
    } catch (err) {
      console.error('Failed to decrypt password for connection', id, err.message);
      connection.password = '';
    }
  }

  return connection;
}

module.exports = { setupMetadataHandlers };