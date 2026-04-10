import React from 'react';
import { X, Plus } from 'lucide-react';
import { useQueryStore } from '../../store/queryStore';

const QueryTabs = () => {
  const { queryTabs, activeTabId, setActiveTab, removeQueryTab, addQueryTab } = useQueryStore();

  return (
    <div className="query-tabs">
      <div className="tabs-container">
        {queryTabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-title">{tab.name}</span>
            {queryTabs.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeQueryTab(tab.id);
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        
        <button className="tab-new" onClick={addQueryTab}>
          <Plus size={14} />
        </button>
      </div>
      
      <style jsx>{`
        .query-tabs {
          background: #181825;
          border-bottom: 1px solid #313244;
          overflow-x: auto;
          overflow-y: hidden;
        }
        
        .tabs-container {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0 8px;
          min-width: min-content;
        }
        
        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #1e1e2e;
          border: 1px solid #313244;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .tab:hover {
          background: #313244;
        }
        
        .tab.active {
          background: #11111b;
          border-bottom-color: #11111b;
          color: #89b4fa;
        }
        
        .tab-title {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tab-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c7086;
          padding: 2px;
          border-radius: 2px;
          display: flex;
          align-items: center;
        }
        
        .tab-close:hover {
          background: #45475a;
          color: #f38ba8;
        }
        
        .tab-new {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c7086;
          padding: 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        
        .tab-new:hover {
          background: #313244;
          color: #89b4fa;
        }
      `}</style>
    </div>
  );
};

export default QueryTabs;