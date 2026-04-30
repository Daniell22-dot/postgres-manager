const { Pool } = require('pg');
const mysql = require('mysql2/promise');

class ConnectionManager {
  constructor() {
    this.pools = new Map(); // connectionId -> Pool (pg) or mysql pool
    this.poolTypes = new Map(); // connectionId -> 'postgres' | 'mysql'
    this.activeQueries = new Map(); // queryId -> cancel function
    this.maxConnections = 5;
    this.idleTimeout = 60000; // 60 seconds
  }

  /**
   * Determine the connection type from config.
   * Falls back to 'postgres' if not specified.
   */
  getType(config) {
    return config.type || 'postgres';
  }

  async getPool(connectionId, config) {
    if (this.pools.has(connectionId)) {
      return this.pools.get(connectionId);
    }

    const type = this.getType(config);
    let pool;

    if (type === 'mysql') {
      pool = mysql.createPool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password || '',
        waitForConnections: true,
        connectionLimit: this.maxConnections,
        connectTimeout: 5000,
        enableKeepAlive: true,
      });

      // Tag the pool so callers can branch
      pool.__type = 'mysql';
    } else {
      pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        max: this.maxConnections,
        idleTimeoutMillis: this.idleTimeout,
        connectionTimeoutMillis: 5000,
        statement_timeout: 60000, // 60 seconds query timeout
        keepAlive: true,
      });

      pool.__type = 'postgres';

      // Handle pool errors
      pool.on('error', (err) => {
        console.error(`Unexpected pool error for ${connectionId}:`, err);
        this.pools.delete(connectionId);
        this.poolTypes.delete(connectionId);
      });
    }

    this.pools.set(connectionId, pool);
    this.poolTypes.set(connectionId, type);
    return pool;
  }

  getPoolType(connectionId) {
    return this.poolTypes.get(connectionId) || 'postgres';
  }

  async cleanupIdlePools() {
    for (const [id, pool] of this.pools.entries()) {
      const type = this.poolTypes.get(id);
      if (type === 'mysql') {
        // mysql2 pools don't expose idle stats easily; skip auto-cleanup
        continue;
      }
      if (pool.idleCount === pool.totalCount && pool.waitingCount === 0) {
        await pool.end();
        this.pools.delete(id);
        this.poolTypes.delete(id);
        console.log(`Cleaned up idle pool: ${id}`);
      }
    }
  }

  async cleanupAllPools() {
    for (const [id, pool] of this.pools.entries()) {
      const type = this.poolTypes.get(id);
      try {
        if (type === 'mysql') {
          await pool.end();
        } else {
          await pool.end();
        }
        console.log(`Closed pool: ${id}`);
      } catch (e) {
        console.warn(`Error closing pool ${id}:`, e.message);
      }
    }
    this.pools.clear();
    this.poolTypes.clear();
  }

  registerQuery(queryId, cancelFn) {
    this.activeQueries.set(queryId, cancelFn);
  }

  unregisterQuery(queryId) {
    this.activeQueries.delete(queryId);
  }

  cancelQuery(queryId) {
    const cancelFn = this.activeQueries.get(queryId);
    if (cancelFn) {
      cancelFn();
      return true;
    }
    return false;
  }
}

// Singleton instance
const manager = new ConnectionManager();

// Run cleanup every 5 minutes
setInterval(() => {
  manager.cleanupIdlePools();
}, 300000);

module.exports = { manager };