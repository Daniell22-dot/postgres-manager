import React, { useState, useEffect } from 'react';
import ConnectionDialog from './ConnectionDialog';
import CreateDatabaseDialog from './CreateDatabaseDialog';
import TreeNode from './TreeNode';
import { ChevronRight, ChevronDown, Database, FolderOpen, Table, Key, Plus } from 'lucide-react';
import { useQueryStore } from '../../store/queryStore';

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

  const handleRefresh = (nodeId, nodeType, nodeContext) => {
    setNodeData(prev => {
      const newMap = new Map(prev);
      newMap.delete(nodeId);
      return newMap;
    });
    if (expandedNodes.has(nodeId)) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      setTimeout(() => toggleNode(nodeId, nodeType, nodeContext), 0);
    }
  };

  const handleViewData = (nodeContext, limit) => {
    const conn = connections.find(c => c.id === nodeContext.connectionId);
    if (conn) {
      handleSelectDatabase(conn, nodeContext.database);
    }
    const query = `SELECT * FROM "${nodeContext.schema}"."${nodeContext.name}"${limit ? ` LIMIT ${limit}` : ''};`;
    const state = useQueryStore.getState();
    const currentTab = state.queryTabs.find(tab => tab.id === state.activeTabId);
    if (currentTab) {
      state.updateTabContent(state.activeTabId, query);
    }
  };
  
  const handleStartApi = async (connectionId) => {
    try {
      const urls = await window.electronAPI.startApi(connectionId);
      alert(`REST API Started!\nAPI URL: ${urls.apiUrl}\nDocs: ${urls.docsUrl}`);
    } catch (e) {
      alert('Failed to start API: ' + e.message);
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
        onRefresh={() => handleRefresh(`conn-${connection.id}`, 'connection', { id: connection.id, connection: connection })}
        onStartApi={() => handleStartApi(connection.id)}
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
            database: item.name,
            connectionId: context.id || context.connectionId 
          };
          break;
        case 'schema':
          icon = <FolderOpen size={14} />;
          childContext = { 
            ...context, 
            name: item.name, 
            schema: item.name,
            database: context.database || context.name,
            connectionId: context.connectionId || context.id 
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
          onRefresh={() => handleRefresh(nodeId, childType, childContext)}
          onViewData={(limit) => handleViewData(childContext, limit)}
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

export default DatabaseTree;