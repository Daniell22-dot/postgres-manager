import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, Clock, HardDrive } from 'lucide-react';
import { useConnectionStore } from '../../store/connectionStore';
import { useUIStore } from '../../store/uiStore';

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [memoryUsage, setMemoryUsage] = useState({ used: 0, total: 0 });
  const { activeConnection, activeDatabase } = useConnectionStore();
  const { theme } = useUIStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Get memory usage if available
    if (window.performance && window.performance.memory) {
      const updateMemory = () => {
        const memory = window.performance.memory;
        setMemoryUsage({
          used: memory.usedJSHeapSize,
          total: memory.jsHeapSizeLimit
        });
      };
      updateMemory();
      const memoryInterval = setInterval(updateMemory, 5000);
      return () => {
        clearInterval(timer);
        clearInterval(memoryInterval);
      };
    }

    return () => clearInterval(timer);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="status-bar" style={{ backgroundColor: theme === 'dark' ? '#181825' : '#f0f0f0' }}>
      <div className="status-left">
        {activeConnection ? (
          <>
            <div className="status-item">
              <Database size={12} />
              <span>{activeConnection.name}</span>
            </div>
            <div className="status-item">
              <Wifi size={12} color="#a6e3a1" />
              <span>Connected</span>
            </div>
            {activeDatabase && (
              <div className="status-item">
                <span className="database-name">{activeDatabase}</span>
              </div>
            )}
          </>
        ) : (
          <div className="status-item">
            <WifiOff size={12} />
            <span>Disconnected</span>
          </div>
        )}
      </div>
      
      <div className="status-right">
        {memoryUsage.total > 0 && (
          <div className="status-item" title={`Memory: ${formatBytes(memoryUsage.used)} / ${formatBytes(memoryUsage.total)}`}>
            <HardDrive size={12} />
            <span>{Math.round((memoryUsage.used / memoryUsage.total) * 100)}%</span>
          </div>
        )}
        
        <div className="status-item">
          <Clock size={12} />
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>
      
    </div>
  );
};

export default StatusBar;