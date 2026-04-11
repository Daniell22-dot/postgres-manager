const Store = require('electron-store');
const { app } = require('electron');

const auditStore = new Store({ name: 'audit-logs' });

class AuditLogger {
  log(event, details = {}) {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      event,
      user: process.env.USER || 'system',
      appVersion: app.getVersion(),
      ...details
    };
    
    const logs = auditStore.get('logs', []);
    logs.unshift(logEntry);
    
    // Keep only last 10,000 logs
    auditStore.set('logs', logs.slice(0, 10000));
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', logEntry);
    }
  }
  
  getLogs(limit = 100, filter = null) {
    let logs = auditStore.get('logs', []);
    if (filter) {
      logs = logs.filter(filter);
    }
    return logs.slice(0, limit);
  }
  
  clearOldLogs(daysToKeep = 30) {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const logs = auditStore.get('logs', []);
    const filtered = logs.filter(log => log.id > cutoff);
    auditStore.set('logs', filtered);
  }
}

module.exports = new AuditLogger();