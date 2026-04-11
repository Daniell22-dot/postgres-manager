const Store = require('electron-store');

class UsageTracker {
  constructor() {
    this.store = new Store({ name: 'analytics' });
    this.optIn = this.store.get('analyticsOptIn', false);
    this.sessionStart = Date.now();
  }
  
  trackEvent(event, data = {}) {
    if (!this.optIn) return;
    
    const eventData = {
      event,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.sessionStart,
      appVersion: app.getVersion(),
      ...data
    };
    
    // Store locally
    const events = this.store.get('events', []);
    events.push(eventData);
    this.store.set('events', events.slice(-1000));
    
    // Send to analytics server (if configured)
    if (process.env.ANALYTICS_URL) {
      this.sendToServer(eventData);
    }
  }
  
  getStats() {
    const events = this.store.get('events', []);
    return {
      totalQueries: events.filter(e => e.event === 'query_executed').length,
      totalConnections: events.filter(e => e.event === 'connection_added').length,
      mostUsedFeatures: this.calculateFeatureUsage(events),
      averageSessionTime: this.calculateAvgSessionTime(events)
    };
  }
}

module.exports = new UsageTracker();