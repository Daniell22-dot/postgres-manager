import React, { useState } from 'react';
import { Bell, RefreshCw, ShieldAlert, Zap, Search, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const NotificationSettings = () => {
  const [checking, setChecking] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [tokenScan, setTokenScan] = useState(true);

  const checkUpdates = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      toast.success('Your version (v1.0.0) is up to date!');
    }, 1500);
  };

  return (
    <div className="settings-panel">
      <div className="panel-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell size={24} className="text-blue-500" />
          <h3 className="text-2xl font-bold">Notifications & Updates</h3>
        </div>
        <p className="text-gray-400 text-sm">Stay informed about new releases and security vulnerabilities.</p>
      </div>

      <div className="setting-group mb-10">
        <label className="text-sm font-semibold uppercase tracking-wider text-gray-400 block mb-4">App Updates</label>
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className={checking ? 'animate-spin text-blue-500' : 'text-gray-500'} size={20} />
              <div>
                <p className="text-sm font-semibold">Current Version: v1.0.0</p>
                <p className="text-xs text-gray-500">Last checked: Today at 2:30 PM</p>
              </div>
            </div>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm transition-colors"
              onClick={checkUpdates}
              disabled={checking}
            >
              {checking ? 'Checking...' : 'Check for Updates'}
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500" size={18} />
              <span className="text-sm">Automatically download and install updates</span>
            </div>
            <button 
              className={`w-12 h-6 rounded-full transition-colors relative ${autoUpdate ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => setAutoUpdate(!autoUpdate)}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoUpdate ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="setting-group">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={18} className="text-red-500" />
          <label className="text-sm font-semibold uppercase tracking-wider text-gray-400">Security Guard (Token Detection)</label>
        </div>
        
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 pr-8">
              <p className="text-sm font-semibold text-gray-200">Hardcoded Token Detection</p>
              <p className="text-xs text-gray-400 mt-1">Automatically scan your SQL queries and configuration files for sensitive tokens, passwords, and API keys.</p>
            </div>
            <button 
              className={`w-12 h-6 rounded-full transition-colors relative ${tokenScan ? 'bg-red-600' : 'bg-gray-700'}`}
              onClick={() => setTokenScan(!tokenScan)}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tokenScan ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {tokenScan && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3 text-xs bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                <Search size={14} className="text-gray-500" />
                <span className="text-gray-400">Scanning active connection for secrets...</span>
              </div>
              <div className="flex items-center gap-3 text-xs bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                <Eye size={14} className="text-green-500" />
                <span className="text-green-400">0 secrets found in current workspace.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
