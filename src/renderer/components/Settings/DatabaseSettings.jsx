import React from 'react';
import { Database, HardDrive, Cpu, Activity, Server } from 'lucide-react';

const DatabaseSettings = () => {
  return (
    <div className="settings-panel">
      <div className="panel-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database size={24} className="text-orange-500" />
          <h3 className="text-2xl font-bold">Database Defaults</h3>
        </div>
        <p className="text-gray-400 text-sm">Configure default behavior for your database connections.</p>
      </div>

      <div className="space-y-6">
        <div className="setting-group">
          <label className="text-sm font-semibold uppercase tracking-wider text-gray-400 block mb-3">Connection Pool</label>
          <div className="bg-gray-800/30 border-gray-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-orange-500" />
                <span className="text-sm">Maximum connections per database</span>
              </div>
              <input type="number" defaultValue={20} className="w-24" />
            </div>
          </div>
        </div>

        <div className="setting-group">
          <label className="text-sm font-semibold uppercase tracking-wider text-gray-400 block mb-3">PostGIS & Extensions</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 border-gray-700/50 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors cursor-pointer">
              <Server size={18} className="text-blue-400" />
              <span className="text-xs font-semibold">Auto-detect PostGIS</span>
            </div>
            <div className="bg-gray-800/30 border-gray-700/50 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors cursor-pointer">
              <HardDrive size={18} className="text-purple-400" />
              <span className="text-xs font-semibold">Fetch View Definitions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSettings;
