import React, { useState, useEffect } from 'react';
import { X, Database, Server, Key, Shield } from 'lucide-react';

const ConnectionDialog = ({ onClose, onSave, connection = null }) => {
  const [formData, setFormData] = useState({
    name: connection?.name || '',
    type: connection?.type || 'postgres',
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
  
  // Defaults per type
  const defaults = {
    postgres: { port: 5432, database: 'postgres', username: 'postgres', ssl_mode: 'prefer' },
    mysql: { port: 3306, database: 'mysql', username: 'root', ssl_mode: 'disable' }
  };
  
  useEffect(() => {
    const d = defaults[formData.type] || defaults.postgres;
    setFormData(prev => ({
      ...prev,
      port: d.port,
      database: d.database,
      username: d.username,
      ssl_mode: d.ssl_mode
    }));
  }, [formData.type]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Don't save pw for local default servers
    let saveData = formData.host === 'localhost' && formData.username === (formData.type === 'mysql' ? 'root' : 'postgres')
      ? { ...formData, password: '' }
      : formData;
      
    // Preserve the original connection ID if editing
    if (connection?.id) {
      saveData.id = connection.id;
    }
    
    await onSave(saveData);
  };
  
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await window.electronAPI.testConnection(formData);
      if (result.success) {
        setTestResult({ success: true, message: `Connected! ${formData.type.toUpperCase()} ${result.version || result.serverVersion}` });
      } else {
        setTestResult({ success: false, message: result.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
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
              Server Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
          </div>

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
              placeholder={formData.type === 'mysql' ? 'mysql' : 'postgres'}
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
                Password (optional for local)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty for local servers"
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

