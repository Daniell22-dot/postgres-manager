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
      

    </div>
  );
};

export default ConnectionDialog;