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
          obj_description((quote_ident($1) || '.' || quote_ident(table_name))::regclass) as comment,
          (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name) as estimated_rows
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

async function getConnectionById(id) {
  const Database = require('better-sqlite3');
  const path = require('path');
  const { app } = require('electron');
  
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'postgres-manager.db');
  const db = new Database(dbPath);
  
  const stmt = db.prepare('SELECT * FROM connections WHERE id = ?');
  const connection = stmt.get(id);
  
  // Decrypt password
  if (connection && connection.encrypted_password) {
    const crypto = require('crypto');
    const [ivHex, encryptedText] = connection.encrypted_password.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from('01234567890123456789012345678901'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    connection.password = decrypted;
  }
  
  db.close();
  return connection;
}

module.exports = { setupMetadataHandlers };