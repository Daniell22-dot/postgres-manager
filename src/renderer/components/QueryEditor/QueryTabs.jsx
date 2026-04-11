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
      

    </div>
  );
};

export default QueryTabs;