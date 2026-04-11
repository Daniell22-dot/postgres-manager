import React, { useState } from 'react';
import { X, Palette, Shield, Key, Users, Bell, Database, Zap } from 'lucide-react';
import ThemeSettings from './ThemeSettings';
import SecuritySettings from './SecuritySettings';
import LicenseSettings from './LicenseSettings';

const SettingsDialog = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('theme');
  
  const tabs = [
    { id: 'theme', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'license', name: 'License', icon: Key },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'performance', name: 'Performance', icon: Zap }
  ];
  
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="settings-container">
          <div className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
          
          <div className="settings-content">
            {activeTab === 'theme' && <ThemeSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'license' && <LicenseSettings />}
            {/* Other tabs... */}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .settings-dialog {
          background: var(--background);
          border-radius: 12px;
          width: 800px;
          max-width: 90vw;
          height: 600px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .settings-container {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .settings-sidebar {
          width: 200px;
          background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 16px;
          overflow-y: auto;
        }
        
        .settings-tab {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
        }
        
        .settings-tab:hover {
          background: var(--surfaceHover);
        }
        
        .settings-tab.active {
          background: var(--primary);
          color: var(--background);
        }
        
        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default SettingsDialog;