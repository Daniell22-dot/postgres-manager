import React, { useState } from 'react';
import { X, Palette, Shield, Key, Users, Bell, Database, Zap } from 'lucide-react';
import ThemeSettings from './ThemeSettings';
import DeveloperSettings from './DeveloperSettings';

const SettingsDialog = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('theme');
  
  const tabs = [
    { id: 'theme', name: 'Appearance', icon: Palette },
    { id: 'developer', name: 'Developer', icon: Zap },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'license', name: 'License', icon: Key },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'database', name: 'Database', icon: Database }
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
                <tab.icon size={18} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
          
          <div className="settings-content">
            {activeTab === 'theme' && <ThemeSettings />}
            {activeTab === 'developer' && <DeveloperSettings />}
            {/* Other tabs... */}
          </div>
        </div>

        <div className="settings-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="apply-btn" onClick={onClose}>Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;