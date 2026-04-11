import React, { useState, useEffect } from 'react';
import ConnectionDialog from './ConnectionDialog';
import CreateDatabaseDialog from './CreateDatabaseDialog';
import { ChevronRight, ChevronDown, Database, FolderOpen, Table, Key, Plus } from 'lucide-react';

const DatabaseTree = ({ onSelectDatabase, onSelectTable }) => {
  const [connections, setConnections] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCreateDatabaseDialog, setShowCreateDatabaseDialog] = useState(false);
  const [selectedConnectionForDb, setSelectedConnectionForDb] = useState(null);
  const [nodeData, setNodeData] = useState(new Map());

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const conns = await window.electronAPI.getConnections();
      setConnections(conns || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const toggleNode = async (nodeId, nodeType, nodeContext) => {
    if (expandedNodes.has(nodeId)) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      return;
    }

    // Expand node
    setExpandedNodes(prev => new Set(prev).add(nodeId));

    // Load data if not already cached
    if (!nodeData.has(nodeId)) {
      setLoadingNodes(prev => new Set(prev).add(nodeId));
      
      let data = [];
      try {
        switch (nodeType) {
          case 'connection':
            console.log('Loading databases for connection:', nodeContext);
            data = await window.electronAPI.getDatabases(nodeContext.id);
            break;
          case 'database':
            console.log('Loading schemas for database:', nodeContext);
            data = await window.electronAPI.getSchemas(nodeContext.connectionId, nodeContext.name);
            break;
          case 'schema':
            console.log('Loading tables for schema:', nodeContext);
            data = await window.electronAPI.getTables(
              nodeContext.connectionId, 
              nodeContext.database, 
              nodeContext.name
            );
            break;
          case 'table':
            console.log('Loading columns for table:', nodeContext);
            data = await window.electronAPI.getColumns(
              nodeContext.connectionId,
              nodeContext.database,
              nodeContext.schema,
              nodeContext.name
            );
            break;
        }
        
        setNodeData(prev => new Map(prev).set(nodeId, data));
      } catch (error) {
        console.error('Error loading node data:', error);
        setNodeData(prev => new Map(prev).set(nodeId, []));
      } finally {
        setLoadingNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }
    }
  };

  const handleSelectDatabase = (connection, database) => {
    if (onSelectDatabase) {
      onSelectDatabase(connection, database);
    }
  };

  const handleSelectTable = (connection, database, schema, table) => {
    if (onSelectTable) {
      onSelectTable(connection, database, schema, table);
    }
  };

  const renderTree = () => {
    return connections.map(connection => (
      <TreeNode
        key={`conn-${connection.id}`}
        id={`conn-${connection.id}`}
        label={connection.name}
        icon={<Database size={16} />}
        type="connection"
        context={{ id: connection.id, ...connection }}
        isExpanded={expandedNodes.has(`conn-${connection.id}`)}
        isLoading={loadingNodes.has(`conn-${connection.id}`)}
        onToggle={() => toggleNode(`conn-${connection.id}`, 'connection', { id: connection.id, connection: connection })}
        onSelect={() => {}}
        connection={connection}
        onCreateDatabase={() => {
          setSelectedConnectionForDb(connection);
          setShowCreateDatabaseDialog(true);
        }}
      >
        {renderChildren(`conn-${connection.id}`, 'database', { connectionId: connection.id, connection: connection })}
      </TreeNode>
    ));
  };

  const renderChildren = (parentId, childType, context) => {
    const data = nodeData.get(parentId) || [];
    const isLoading = loadingNodes.has(parentId);
    
    if (isLoading) {
      return <div className="loading-placeholder">Loading...</div>;
    }
    
    return data.map((item, index) => {
      let nodeId = `${parentId}-${childType}-${item.name || item.table_name || index}`;
      let icon;
      let childContext = { ...context };
      
      switch (childType) {
        case 'database':
          icon = <Database size={14} />;
          childContext = { 
            ...context, 
            name: item.name, 
            connectionId: context.connectionId 
          };
          break;
        case 'schema':
          icon = <FolderOpen size={14} />;
          childContext = { 
            ...context, 
            name: item.name, 
            database: context.database,
            connectionId: context.connectionId 
          };
          break;
        case 'table':
          icon = <Table size={14} />;
          childContext = {
            ...context,
            name: item.name,
            schema: context.schema,
            database: context.database,
            estimatedRows: item.estimated_rows,
            comment: item.comment
          };
          break;
        case 'column':
          icon = <Key size={12} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '24px' }}>
                {icon}
                <span className="tree-label">
                  {item.name}
                  <span className="column-type"> ({item.type})</span>
                </span>
              </div>
            </div>
          );
        default:
          icon = null;
      }
      
      return (
        <TreeNode
          key={nodeId}
          id={nodeId}
          label={item.name || item.table_name}
          icon={icon}
          type={childType}
          context={childContext}
          isExpanded={expandedNodes.has(nodeId)}
          isLoading={loadingNodes.has(nodeId)}
          onToggle={() => toggleNode(nodeId, childType, childContext)}
          onSelect={() => {
            if (childType === 'database') {
              const connection = connections.find(c => c.id === context.connectionId);
              handleSelectDatabase(connection, item.name);
            } else if (childType === 'table') {
              handleSelectTable(context.connection, context.database, context.schema, item.name);
            }
          }}
        >
          {renderChildren(
            nodeId, 
            childType === 'database' ? 'schema' : 
            childType === 'schema' ? 'table' : 
            childType === 'table' ? 'column' : null,
            childContext
          )}
        </TreeNode>
      );
    });
  };

  return (
    <div className="tree-container">
      <button 
        className="new-connection-btn"
        onClick={() => setShowConnectionDialog(true)}
      >
        + New Connection
      </button>
      
      <div className="database-tree">
        {renderTree()}
      </div>
      
      {showConnectionDialog && (
        <ConnectionDialog
          onClose={() => setShowConnectionDialog(false)}
          onSave={async (connection) => {
            await window.electronAPI.saveConnection(connection);
            await loadConnections();
            setShowConnectionDialog(false);
          }}
        />
      )}
      
      {showCreateDatabaseDialog && selectedConnectionForDb && (
        <CreateDatabaseDialog
          connection={selectedConnectionForDb}
          onClose={() => {
            setShowCreateDatabaseDialog(false);
            setSelectedConnectionForDb(null);
          }}
          onDatabaseCreated={async (databaseName) => {
            // Refresh the tree to show new database
            setNodeData(new Map()); // Clear cache
            await loadConnections();
            setShowCreateDatabaseDialog(false);
            setSelectedConnectionForDb(null);
          }}
        />
      )}
    </div>
  );
};

// TreeNode Component
const TreeNode = ({ id, label, icon, type, context, isExpanded, isLoading, onToggle, onSelect, children, connection, onCreateDatabase }) => {
  const hasChildren = children && children.props && children.props.children;
  
  return (
    <div className="tree-node">
      <div 
        className="tree-node-content"
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren && onToggle) {
            onToggle();
          }
          if (onSelect) {
            onSelect();
          }
        }}
      >
        <span className="tree-icon">
          {isLoading ? (
            <div className="spinner-small"></div>
          ) : hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span style={{ width: 14 }}></span>
          )}
        </span>
        {icon && <span className="tree-icon">{icon}</span>}
        <span className="tree-label">{label}</span>
        {type === 'table' && context.estimatedRows && (
          <span className="tree-badge">{context.estimatedRows.toLocaleString()} rows</span>
        )}
        {type === 'connection' && onCreateDatabase && (
          <button 
            className="create-db-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCreateDatabase();
            }}
            title="Create new database"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="tree-children">
          {children}
        </div>
      )}
      
      <style jsx>{`
        .create-db-btn {
          background: #313244;
          border: none;
          border-radius: 4px;
          padding: 2px 4px;
          cursor: pointer;
          color: #89b4fa;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        
        .create-db-btn:hover {
          background: #89b4fa;
          color: #1e1e2e;
          transform: scale(1.05);
        }
        
        .spinner-small {
          width: 12px;
          height: 12px;
          border: 2px solid #313244;
          border-top-color: #89b4fa;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DatabaseTree;