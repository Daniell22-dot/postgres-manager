/**
 * Default configuration for Postgres Manager
 */
module.exports = {
  // Application settings
  app: {
    name: 'Postgres Manager',
    version: '1.0.0',
    developer: 'Daniel Manyasa',
  },

  // Database defaults
  database: {
    defaultPort: 5432,
    defaultHost: 'localhost',
    connectionTimeout: 10000,
  },

  // API Gateway (PostgREST) settings
  api: {
    basePort: 3000,
    autoStart: false,
  },

  // UI defaults
  ui: {
    theme: 'dark',
    fontSize: 14,
    showLineNumbers: true,
  }
};
