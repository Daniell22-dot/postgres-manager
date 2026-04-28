import React from 'react';
import { Shield, Lock, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SecuritySettings = () => {
  const handleChangeKey = () => {
    toast('Master Key change functionality will be available in the next security update.', {
      icon: '🛡️',
    });
  };

  return (
    <div className="settings-panel">
      <div className="panel-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-green-500" />
          <h3 className="text-2xl font-bold">Security & Privacy</h3>
        </div>
        <p className="text-gray-400 text-sm">Manage how your passwords and data are protected.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800/30 border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Lock size={20} className="text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">Encrypted Password Storage</h4>
              <p className="text-xs text-gray-500">Your connection passwords are encrypted using AES-256 before being saved to disk.</p>
            </div>
            <button 
              className="btn-premium"
              onClick={handleChangeKey}
            >
              Change Master Key
            </button>
          </div>
        </div>

        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Key size={20} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">Session Lock</h4>
              <p className="text-xs text-gray-500">Automatically lock the application after a period of inactivity.</p>
            </div>
            <select className="bg-gray-900 border border-gray-700 rounded-md text-xs p-1.5 outline-none">
              <option>After 15 minutes</option>
              <option>After 1 hour</option>
              <option>Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
