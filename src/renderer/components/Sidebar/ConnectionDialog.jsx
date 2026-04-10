import React, { useState } from 'react';
import { X, Database, Server, Key, Shield } from 'lucide-react';

const ConnectionDialog = ({ onClose, onSave, connection = null }) => {
  const [formData, setFormData] = useState({
    name: connection?.name || '',
    host: connection?.host || 'localhost',
    port: connection?.port || 5432,
    database: connection?.database || 'postgres',
    username: connection?.username || 'postgres',
    password: connection?.password || '',
    ssl_mode: connection?.ssl_mode || 'prefer',
    color: connection?.color || '#89b4fa',
    group_name: connection?.group_name || ''
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
  };
  
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    const result = await window.electronAPI.testConnection(formData);
    
    if (result.success) {
      setTestResult({ success: true, message: `Connected! PostgreSQL ${result.version}` });
    } else {
      setTestResult({ success: false, message: result.error });
    }
    
    setTesting(false);
  };
  
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{connection ? 'Edit Connection' : 'New Connection'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <Database size={14} />
              Connection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Production DB, Local Dev, etc."
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <Server size={14} />
                Host *
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Database Name</label>
            <input
              type="text"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              placeholder="postgres"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>
                <Key size={14} />
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>
              <Shield size={14} />
              SSL Mode
            </label>
            <select
              value={formData.ssl_mode}
              onChange={(e) => setFormData({ ...formData, ssl_mode: e.target.value })}
            >
              <option value="disable">Disable</option>
              <option value="prefer">Prefer</option>
              <option value="require">Require</option>
              <option value="verify-ca">Verify CA</option>
              <option value="verify-full">Verify Full</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Color Tag</label>
            <div className="color-picker">
              {['#89b4fa', '#a6e3a1', '#f9e2af', '#f38ba8', '#cba6f7', '#94e2d5'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          
          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}
          
          <div className="dialog-footer">
            <button type="button" onClick={testConnection} disabled={testing}>
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button type="submit" className="primary">
              Save Connection
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .dialog {
          background: #1e1e2e;
          border-radius: 12px;
          width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .dialog-header {
          padding: 20px;
          border-bottom: 1px solid #313244;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dialog-header h3 {
          margin: 0;
          color: #cdd6f4;
        }
        
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c7086;
          padding: 4px;
        }
        
        form {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #cdd6f4;
        }
        
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          background: #11111b;
          border: 1px solid #313244;
          border-radius: 6px;
          color: #cdd6f4;
          font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #89b4fa;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .color-picker {
          display: flex;
          gap: 8px;
        }
        
        .color-option {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .color-option.selected {
          border-color: white;
          transform: scale(1.1);
        }
        
        .test-result {
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 13px;
        }
        
        .test-result.success {
          background: rgba(166, 227, 161, 0.1);
          color: #a6e3a1;
          border: 1px solid #a6e3a1;
        }
        
        .test-result.error {
          background: rgba(243, 139, 168, 0.1);
          color: #f38ba8;
          border: 1px solid #f38ba8;
        }
        
        .dialog-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .dialog-footer button {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .dialog-footer button:not(.primary) {
          background: #313244;
          color: #cdd6f4;
        }
        
        .dialog-footer button.primary {
          background: #89b4fa;
          color: #1e1e2e;
          font-weight: 600;
        }
        
        .dialog-footer button:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default ConnectionDialog;