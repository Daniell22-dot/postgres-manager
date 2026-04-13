const { manager } = require('./connection-manager');

function setupMetadataHandlers(ipcMain) {
  // Get databases
  ipcMain.handle('db:getDatabases', async (event, connectionId) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    try {
      const pool = await manager.getPool(connectionId, connection);
      const client = await pool.connect();
      
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
  
  // Get schemas - THIS IS KEY FOR SHOWING PUBLIC SCHEMA
  ipcMain.handle('db:getSchemas', async (event, connectionId, database) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    const dbConfig = { ...connection, database };
    const poolKey = `${connectionId}-${database}`;
    
    try {
      const pool = await manager.getPool(poolKey, dbConfig);
      const client = await pool.connect();
      
      // Get all non-system schemas (including public)
      const result = await client.query(`
        SELECT 
          schema_name as name,
          schema_owner as owner
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
          AND schema_name NOT LIKE 'pg_%'
        ORDER BY 
          CASE WHEN schema_name = 'public' THEN 0 ELSE 1 END,
          schema_name
      `);
      
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching schemas:', error);
      return [];
    }
  });
  
  // Get tables in schema
  ipcMain.handle('db:getTables', async (event, connectionId, database, schema) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    const dbConfig = { ...connection, database };
    const poolKey = `${connectionId}-${database}`;
    
    try {
      const pool = await manager.getPool(poolKey, dbConfig);
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT 
          table_name as name,
          obj_description((quote_ident($1) || '.' || quote_ident(table_name))::regclass) as comment,
          (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name) as estimated_rows
        FROM information_schema.tables
        WHERE table_schema = $1
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schema]);
      
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  });
  
  // Get columns for table
  ipcMain.handle('db:getColumns', async (event, connectionId, database, schema, table) => {
    const connection = await getConnectionById(connectionId);
    if (!connection) return [];
    
    const dbConfig = { ...connection, database };
    const poolKey = `${connectionId}-${database}`;
    
    try {
      const pool = await manager.getPool(poolKey, dbConfig);
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

async function getConnectionById(id) {
  const Store = require('electron-store');
  const crypto = require('crypto');
  const store = new Store({ name: 'postgres-manager-data' });
  const connections = store.get('connections', []);
  const connection = connections.find(c => String(c.id) === String(id));

  if (!connection) {
    return null;
  }

  let password = '';
  if (connection.encrypted_password) {
    try {
      const ENCRYPTION_KEY = crypto.scryptSync('postgres-manager-secret-v1', 'salt-pg-mgr', 32);
      const [ivHex, encryptedText] = connection.encrypted_password.split(':');
      if (ivHex && encryptedText) {
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        password = decipher.update(encryptedText, 'hex', 'utf8');
        password += decipher.final('utf8');
      }
    } catch (error) {
      console.error('Failed to decrypt password for metadata connection:', error.message);
    }
  }

  return {
    ...connection,
    password
  };
}

module.exports = { setupMetadataHandlers };
