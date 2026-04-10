const { Pool } = require('pg');

class ConnectionManager {
  constructor() {
    this.pools = new Map(); // connectionId -> Pool
    this.activeQueries = new Map(); // queryId -> cancel function
    this.maxConnections = 5;
    this.idleTimeout = 60000; // 60 seconds
  }

  async getPool(connectionId, config) {
    if (this.pools.has(connectionId)) {
      return this.pools.get(connectionId);
    }

    const pool = new Pool({
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

    // Handle pool errors
    pool.on('error', (err) => {
      console.error(`Unexpected pool error for ${connectionId}:`, err);
      this.pools.delete(connectionId);
    });

    this.pools.set(connectionId, pool);
    return pool;
  }

  async cleanupIdlePools() {
    for (const [id, pool] of this.pools.entries()) {
      if (pool.idleCount === pool.totalCount && pool.waitingCount === 0) {
        await pool.end();
        this.pools.delete(id);
        console.log(`Cleaned up idle pool: ${id}`);
      }
    }
  }

  async cleanupAllPools() {
    for (const [id, pool] of this.pools.entries()) {
      await pool.end();
      console.log(`Closed pool: ${id}`);
    }
    this.pools.clear();
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