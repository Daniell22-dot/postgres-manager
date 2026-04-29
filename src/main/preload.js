const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Connections
  getConnections: () => ipcRenderer.invoke('db:getConnections'),
  saveConnection: (connection) => ipcRenderer.invoke('db:saveConnection', connection),
  deleteConnection: (id) => ipcRenderer.invoke('db:deleteConnection', id),
  testConnection: (config) => ipcRenderer.invoke('db:testConnection', config),
  
  // Database Creation
  createDatabase: (connectionId, databaseName, owner, encoding) => 
    ipcRenderer.invoke('db:createDatabase', connectionId, databaseName, owner, encoding),

  // API Gateway
  startApi: (connectionId) => ipcRenderer.invoke('db:startApi', connectionId),
  stopApi: (connectionId) => ipcRenderer.invoke('db:stopApi', connectionId),

  // Metadata (lazy loading)
  getDatabases: (connectionId) => ipcRenderer.invoke('db:getDatabases', connectionId),
  getSchemas: (connectionId, database) => ipcRenderer.invoke('db:getSchemas', connectionId, database),
  getTables: (connectionId, database, schema) => ipcRenderer.invoke('db:getTables', connectionId, database, schema),
  getColumns: (connectionId, database, schema, table) => ipcRenderer.invoke('db:getColumns', connectionId, database, schema, table),
  getExtensions: (connectionId, database) => ipcRenderer.invoke('db:getExtensions', connectionId, database),
  getViews: (connectionId, database, schema) => ipcRenderer.invoke('db:getViews', connectionId, database, schema),
  getFunctions: (connectionId, database, schema) => ipcRenderer.invoke('db:getFunctions', connectionId, database, schema),
  getProcedures: (connectionId, database, schema) => ipcRenderer.invoke('db:getProcedures', connectionId, database, schema),
  getSequences: (connectionId, database, schema) => ipcRenderer.invoke('db:getSequences', connectionId, database, schema),
  
  // Queries
  executeQuery: (connectionId, database, sql, params) => 
    ipcRenderer.invoke('db:executeQuery', connectionId, database, sql, params),
  cancelQuery: (queryId) => ipcRenderer.invoke('db:cancelQuery', queryId),
  
  // History
  getQueryHistory: (connectionId, limit) => ipcRenderer.invoke('db:getQueryHistory', connectionId, limit),
  
// Utilities
  exportToCSV: (data, filename) => ipcRenderer.invoke('db:exportToCSV', data, filename),
  
  // PG Shell Commands
  pgCommand: (connectionId, database, cmd) => ipcRenderer.invoke('db:pgCommand', connectionId, database, cmd),
});
