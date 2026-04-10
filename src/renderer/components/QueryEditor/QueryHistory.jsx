import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Database, AlertCircle, ChevronRight } from 'lucide-react';
import { formatSQL } from '../../utils/sqlFormatter';

const QueryHistory = ({ connectionId, onLoadQuery, onClose }) => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [connectionId]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await window.electronAPI.getQueryHistory(connectionId, 200);
    setHistory(data);
    setLoading(false);
  };

  const filteredHistory = history.filter(item => 
    item.sql_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const getQueryType = (sql) => {
    const upperSql = sql.trim().toUpperCase();
    if (upperSql.startsWith('SELECT')) return { type: 'SELECT', color: '#89b4fa' };
    if (upperSql.startsWith('INSERT')) return { type: 'INSERT', color: '#a6e3a1' };
    if (upperSql.startsWith('UPDATE')) return { type: 'UPDATE', color: '#f9e2af' };
    if (upperSql.startsWith('DELETE')) return { type: 'DELETE', color: '#f38ba8' };
    if (upperSql.startsWith('CREATE')) return { type: 'CREATE', color: '#cba6f7' };
    if (upperSql.startsWith('DROP')) return { type: 'DROP', color: '#f38ba8' };
    if (upperSql.startsWith('ALTER')) return { type: 'ALTER', color: '#94e2d5' };
    return { type: 'QUERY', color: '#6c7086' };
  };

  return (
    <div className="history-sidebar">
      <div className="history-header">
        <div className="header-title">
          <Clock size={18} />
          <h3>Query History</h3>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="search-box">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="history-list">
        {loading ? (
          <div className="loading">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="empty">No query history found</div>
        ) : (
          filteredHistory.map((item) => {
            const queryType = getQueryType(item.sql_text);
            return (
              <div
                key={item.id}
                className="history-item"
                onClick={() => onLoadQuery(item.sql_text)}
              >
                <div className="item-header">
                  <div className="query-type" style={{ background: queryType.color }}>
                    {queryType.type}
                  </div>
                  <div className="query-time">{formatDate(item.executed_at)}</div>
                  <div className="query-duration">
                    {item.duration_ms}ms
                  </div>
                  {item.row_count > 0 && (
                    <div className="query-rows">
                      <Database size={12} />
                      {item.row_count.toLocaleString()} rows
                    </div>
                  )}
                  {item.error && (
                    <div className="query-error" title={item.error}>
                      <AlertCircle size={12} />
                      Error
                    </div>
                  )}
                </div>
                
                <div className="query-sql">
                  {item.sql_text.length > 200 
                    ? item.sql_text.substring(0, 200) + '...' 
                    : item.sql_text}
                </div>
                
                {item.error && (
                  <div className="error-message">{item.error}</div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <style jsx>{`
        .history-sidebar {
          position: fixed;
          right: 0;
          top: 0;
          width: 500px;
          height: 100vh;
          background: #1e1e2e;
          border-left: 1px solid #313244;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #313244;
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .header-title h3 {
          margin: 0;
          color: #cdd6f4;
        }
        
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c7086;
          padding: 4px;
          border-radius: 4px;
        }
        
        .close-btn:hover {
          background: #313244;
          color: #f38ba8;
        }
        
        .search-box {
          display: flex;
          align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-bottom: 1px solid #313244;
        }
        
        .search-box input { 
            width: 100%;
            padding: 8px 12px;
            background: #1e1e2e;
            border: 1px solid #313244;
            border-radius: 6px;
            color: #cdd6f4;
        }
         . search-box input:focus {
            outline: none;
            border-color: #89b4fa;
        }
        .history-list {
          flex: 1;
          overflow-y: auto;
        }
          .history-item {
          padding: 12px 20px;
          border-bottom: 1px solid #313244;
          cursor: pointer;
          transition: background 0.2s;
        }
          .history-item:hover {
          background: #313244;
        }
        .item-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 6px;
        }
        .query-type {
          padding: 2px 6px;
          border-radius: 4px;
            font-size: 10px;
            color: #1e1e2e;
            font-weight: 600;
        }
        .query-time {
          font-size: 12px;
            color: #6c7086;
        }
        .query-duration {
          font-size: 12px;
            color: #6c7086;
        }
        .query-rows {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .query-rows svg {
          color: #a6e3a1;
        }
        .query-error {
          display: flex;
          align-items: center;
            gap: 4px;
        }
        .query-error svg {
          color: #f38ba8;   
        }
        .query-sql {
          font-size: 13px;
          color: #cdd6f4;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .error-message {
            margin-top: 6px;
            padding: 8px;
            background: rgba(243, 139, 168, 0.1);
            color: #f38ba8;
            border: 1px solid #f38ba8;
            border-radius: 4px;
            font-size: 12px;
        }
         .loading, .empty {
          padding: 20px;
          text-align: center;
          color: #6c7086;
        }
      `}</style>
    </div>
  );
}; export default QueryHistory;
// React component for displaying query history in a sidebar, allowing users to search, view details, and load previous queries.
// It fetches history data from the main process, formats it, and provides a user-friendly interface to interact with past queries.
// The component includes features like query type badges, execution time formatting, and error display for failed queries.