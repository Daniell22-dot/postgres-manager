import React, { useState, useEffect } from 'react';
import TreeNode from './TreeNode';
import ConnectionDialog from './ConnectionDialog';
import { ChevronRight, Database, FolderOpen, Table, Key, Loader } from 'lucide-react';

const DatabaseTree = ({ onSelectDatabase }) => {
  const [connections, setConnections] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [nodeData, setNodeData] = useState(new Map()); // Cache for loaded data

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const conns = await window.electronAPI.getConnections();
    setConnections(conns);
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
            data = await window.electronAPI.getDatabases(nodeContext.id);
            break;
          case 'database':
            data = await window.electronAPI.getSchemas(nodeContext.connectionId, nodeContext.name);
            break;
          case 'schema':
            data = await window.electronAPI.getTables(
              nodeContext.connectionId, 
              nodeContext.database, 
              nodeContext.name
            );
            break;
          case 'table':
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
    onSelectDatabase(connection, database);
  };

  const handleDeleteConnection = async (connectionId) => {
    if (window.confirm('Delete this connection? This cannot be undone.')) {
      await window.electronAPI.deleteConnection(connectionId);
      await loadConnections();
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
        onToggle={() => toggleNode(`conn-${connection.id}`, 'connection', { id: connection.id })}
        onDelete={() => handleDeleteConnection(connection.id)}
        children={renderChildren(`conn-${connection.id}`, 'database', { connectionId: connection.id })}
        onSelect={() => {}}
      />
    ));
  };

  const renderChildren = (parentId, childType, context) => {
    const data = nodeData.get(parentId) || [];
    const isLoading = loadingNodes.has(parentId);
    
    if (isLoading) {
      return <div className="loading-placeholder">Loading...</div>;
    }
    
    return data.map((item, index) => {
      let nodeId = `${parentId}-${childType}-${item.name || index}`;
      let icon;
      let childContext = { ...context };
      
      switch (childType) {
        case 'database':
          icon = <Database size={14} />;
          childContext = { ...context, name: item.name, connectionId: context.connectionId };
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
          label={item.name}
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
            }
          }}
          children={renderChildren(
            nodeId, 
            childType === 'database' ? 'schema' : 
            childType === 'schema' ? 'table' : 
            childType === 'table' ? 'column' : null,
            childContext
          )}
        />
      );
    });
  };

  return (
    <div className="tree-container">
      <button 
        className="new-connection-btn"
        onClick={() => setShowConnectionDialog(true)}
        style={{ marginBottom: '16px' }}
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
    </div>
  );
};

export default DatabaseTree;