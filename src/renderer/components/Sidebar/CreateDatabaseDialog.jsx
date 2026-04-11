import React, { useState } from 'react';
import { X, Database, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateDatabaseDialog = ({ connection, onClose, onDatabaseCreated }) => {
  const [databaseName, setDatabaseName] = useState('');
  const [owner, setOwner] = useState(connection.username);
  const [encoding, setEncoding] = useState('UTF8');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!databaseName.trim()) {
      setError('Database name is required');
      return;
    }
    
    // Validate database name (PostgreSQL rules)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
      setError('Database name must start with a letter or underscore and contain only letters, numbers, or underscores');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      const result = await window.electronAPI.createDatabase(
        connection.id,
        databaseName,
        owner,
        encoding
      );
      
      if (result.success) {
        toast.success(`Database "${databaseName}" created successfully!`);
        onDatabaseCreated(databaseName);
      } else {
        setError(result.error);
        toast.error(`Failed to create database: ${result.error}`);
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <Database size={18} style={{ display: 'inline', marginRight: '8px' }} />
            Create New Database
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Connection</label>
            <input
              type="text"
              value={connection.name}
              disabled
              style={{ background: '#313244', cursor: 'not-allowed' }}
            />
          </div>
          
          <div className="form-group">
            <label>Database Name *</label>
            <input
              type="text"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              placeholder="my_new_database"
              autoFocus
              required
            />
            <small style={{ color: '#6c7086', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Name must start with a letter or underscore
            </small>
          </div>
          
          <div className="form-group">
            <label>Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Database owner"
            />
            <small style={{ color: '#6c7086', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Leave empty to use default (current user)
            </small>
          </div>
          
          <div className="form-group">
            <label>Encoding</label>
            <select value={encoding} onChange={(e) => setEncoding(e.target.value)}>
              <option value="UTF8">UTF8</option>
              <option value="LATIN1">LATIN1</option>
              <option value="SQL_ASCII">SQL_ASCII</option>
            </select>
          </div>
          
          {error && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="dialog-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Database'}
            </button>
          </div>
        </form>
      </div>
      

    </div>
  );
};

export default CreateDatabaseDialog;