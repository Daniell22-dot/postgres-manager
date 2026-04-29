import React from 'react';
import { Clock, BarChart3, Zap } from 'lucide-react';

const ProfilerPanel = ({ plan, duration, rowCount, buffers }) => {
  const parsePlan = (planJson) => {
    if (typeof planJson === 'string') {
      try {
        return JSON.parse(planJson);
      } catch {
        return { 'Execution Time': planJson };
      }
    }
    return planJson;
  };

  const parsedPlan = parsePlan(plan);

  return (
    <div className="profiler-panel">
      <div className="panel-header flex items-center gap-2 mb-4">
        <Zap size={20} className="text-yellow-400" />
        <h3 className="text-lg font-bold">Query Profiler</h3>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} />
            <span className="text-sm font-medium text-yellow-400">Duration</span>
          </div>
          <div className="text-2xl font-bold">{duration ? (duration / 1000).toFixed(2) + 's' : 'N/A'}</div>
        </div>
        <div className="stat-card bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} />
            <span className="text-sm font-medium text-blue-400">Rows</span>
          </div>
          <div className="text-2xl font-bold">{rowCount?.toLocaleString() || 'N/A'}</div>
        </div>
        <div className="stat-card bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} />
            <span className="text-sm font-medium text-green-400">Buffers</span>
          </div>
          <div className="text-2xl font-bold">{buffers || 'N/A'}</div>
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        <pre className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-300">
          {JSON.stringify(parsedPlan, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ProfilerPanel;
