import React, { useState, useEffect } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import ConnectionDialog from './ConnectionDialog';
import CreateDatabaseDialog from './CreateDatabaseDialog';
import TreeNode from './TreeNode';
import { Database, FolderOpen, Table, Key, Zap, Eye, Cog, Hash, Play, Server as ServerIcon } from 'lucide-react';
import { useQueryStore } from '../../store/queryStore';

const DatabaseTree = ({ onSelectDatabase, onSelectTable }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showCreateDatabaseDialog, setShowCreateDatabaseDialog] = useState(false);
  const [selectedConnectionForDb, setSelectedConnectionForDb] = useState(null);
  const [nodeData, setNodeData] = useState(new Map());
  
  const { connections, connectionStatuses, ensureLocalServers, testConnectionStatus, updateStatus } = useConnectionStore();

  useEffect(() => {
    ensureLocalServers();
    // Test status for local servers
    connections.forEach(conn => {
      if (conn.isLocal) testConnectionStatus(conn.id);
    });
  }, []);

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

    // For connection, test status first
    if (nodeType === 'connection') {
      updateStatus(nodeContext.id, { status: 'checking', lastChecked: Date.now() });
      testConnectionStatus(nodeContext.id);
    }

    // Load data if not already cached
    if (!nodeData.has(nodeId)) {
      setLoadingNodes(prev => new Set(prev).add(nodeId));
      
      let data = [];
      try {
        switch (nodeType) {
          case 'connection':
            data = await window.electronAPI.getDatabases(nodeContext.id);
            break;
          case 'extensions-group':
            data = await window.electronAPI.getExtensions(nodeContext.connectionId, nodeContext.database);
            break;
          case 'schemas-group':
            data = await window.electronAPI.getSchemas(nodeContext.connectionId, nodeContext.database);
            break;
          case 'schema':
            data = [];
            break;
          case 'tables-group':
            data = await window.electronAPI.getTables(
              nodeContext.connectionId, 
              nodeContext.database, 
              nodeContext.schema
            );
            break;
          case 'views-group':
            data = await window.electronAPI.getViews(nodeContext.connectionId, nodeContext.database, nodeContext.schema);
            break;
          case 'functions-group':
            data = await window.electronAPI.getFunctions(nodeContext.connectionId, nodeContext.database, nodeContext.schema);
            break;
          case 'procedures-group':
            data = await window.electronAPI.getProcedures(nodeContext.connectionId, nodeContext.database, nodeContext.schema);
            break;
          case 'sequences-group':
            data = await window.electronAPI.getSequences(nodeContext.connectionId, nodeContext.database, nodeContext.schema);
            break;
          case 'table':
            data = await window.electronAPI.getColumns(nodeContext.connectionId, nodeContext.database, nodeContext.schema, nodeContext.name);
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

  const handleTestStatus = async (connectionId) => {
    const { status, result } = await testConnectionStatus(connectionId);
    if (status === 'fine') {
      const versionInfo = result?.version || result?.serverVersion || result?.message || 'Up and running';
      alert(`Server is up and running!\n\n${versionInfo}`);
    } else {
      alert(`Connection failed.\n\nError: ${result?.error || 'Unknown error'}`);
    }
  };

  // Simplified createGroupNode without schemas-group etc for direct structure
  const createGroupNode = (parentId, groupType, label, icon, context) => {
    const nodeId = `${parentId}-${groupType}`;
    return (
      <TreeNode
        key={nodeId}
        id={nodeId}
        label={label}
        icon={icon}
        type={groupType}
        context={context}
        isExpanded={expandedNodes.has(nodeId)}
        isLoading={loadingNodes.has(nodeId)}
        onToggle={() => toggleNode(nodeId, groupType, context)}
        onRefresh={() => handleRefresh(nodeId, groupType, context)}
      >
        {renderChildren(nodeId, groupType, context)}
      </TreeNode>
    );
  };

  const renderChildren = (parentId, childType, context) => {
    const data = nodeData.get(parentId) || [];
    const isLoading = loadingNodes.has(parentId);
    
    if (isLoading) return <div className="loading-placeholder">Loading...</div>;
    
    return data.map((item, index) => {
      const nodeId = `${parentId}-${item.name || index}`;
      let icon, childContext = { ...context }, nextChildType = null;
      let nodeType = childType;

      switch (childType) {
        case 'connection':
          return renderDatabaseNode(context.id, item.name, item);
        case 'extensions-group':
          icon = <Zap size={14} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '40px' }}>
                {icon} <span className="tree-label">{item.name}</span>
              </div>
            </div>
          );
        case 'schemas-group':
          icon = <FolderOpen size={14} />;
          childContext.schema = item.name;
          return renderSchemaNode(parentId, item.name, childContext);
        case 'tables-group':
          icon = <Table size={14} />;
          childContext.name = item.name;
          childContext.estimatedRows = item.estimated_rows;
          nextChildType = 'table';
          nodeType = 'table';
          break;
        case 'table':
          icon = <Key size={12} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '40px' }}>
                {icon} <span className="tree-label">{item.name} <span style={{opacity: 0.5, fontSize: '10px'}}>({item.type})</span></span>
              </div>
            </div>
          );
        // Similar for views, functions etc. (shortened for brevity)
        default:
          icon = null;
      }
      
      return (
        <TreeNode
          key={nodeId}
          id={nodeId}
          label={item.name}
          icon={icon}
          type={nodeType}
          context={childContext}
          isExpanded={expandedNodes.has(nodeId)}
          isLoading={loadingNodes.has(nodeId)}
          onToggle={() => toggleNode(nodeId, nodeType, childContext)}
          onRefresh={() => handleRefresh(nodeId, nodeType, childContext)}
          onViewData={(limit) => handleViewData(childContext, limit)}
        >
          {nextChildType && renderChildren(nodeId, nextChildType, childContext)}
        </TreeNode>
      );
    });
  };

  const renderDatabaseNode = (connectionId, databaseName) => {
    const nodeId = `db-${connectionId}-${databaseName}`;
    const dbContext = { connectionId, name: databaseName, database: databaseName };
    const connection = connections.find(c => c.id === connectionId);
    
    return (
      <TreeNode
        key={nodeId}
        id={nodeId}
        label={databaseName}
        icon={<Database size={14} />}
        type="database"
        context={dbContext}
        isExpanded={expandedNodes.has(nodeId)}
        isLoading={loadingNodes.has(nodeId)}
        onToggle={() => toggleNode(nodeId, 'database', dbContext)}
        onRefresh={() => handleRefresh(nodeId, 'database', dbContext)}
        onSelect={() => handleSelectDatabase(connection, databaseName)}
      >
        {expandedNodes.has(nodeId) && (
          <>
            {createGroupNode(nodeId, 'extensions-group', 'Extensions', <Zap size={14} />, dbContext)}
            {createGroupNode(nodeId, 'schemas-group', 'Schemas', <FolderOpen size={14} />, dbContext)} {/* Public first via backend */}
          </>
        )}
      </TreeNode>
    );
  };

  const renderSchemaNode = (parentId, schemaName, schemaContext) => {
    const nodeId = `schema-${parentId}-${schemaName}`;
    return (
      <TreeNode
        key={nodeId}
        id={nodeId}
        label={schemaName}
        icon={<FolderOpen size={14} />}
        type="schema"
        context={schemaContext}
        isExpanded={expandedNodes.has(nodeId)}
        isLoading={loadingNodes.has(nodeId)}
        onToggle={() => toggleNode(nodeId, 'schema', schemaContext)}
      >
        {expandedNodes.has(nodeId) && (
          <>
            {createGroupNode(nodeId, 'tables-group', 'Tables', <Table size={14} />, schemaContext)}
            {createGroupNode(nodeId, 'views-group', 'Views', <Eye size={14} />, schemaContext)}
            {createGroupNode(nodeId, 'functions-group', 'Functions', <Cog size={14} />, schemaContext)}
          </>
        )}
      </TreeNode>
    );
  };

  const renderTree = () => {
    return (
      <>
        <div className="servers-header">
          <ServerIcon size={16} /> Servers
        </div>
        {connections.map(connection => {
          const status = connectionStatuses[connection.id];
          const nodeId = `conn-${connection.id}`;
          
          return (
            <TreeNode
              key={nodeId}
              id={nodeId}
              label={connection.name}
              icon={<Database size={16} />}
              type="connection"
              context={{ id: connection.id, ...connection }}
              status={status}
              isExpanded={expandedNodes.has(nodeId)}
              isLoading={loadingNodes.has(nodeId)}
              onToggle={() => toggleNode(nodeId, 'connection', { id: connection.id, connection })}
              onRefresh={() => handleRefresh(nodeId, 'connection', { id: connection.id, connection })}
              onStartApi={() => handleStartApi(connection.id)}
              onTestStatus={() => handleTestStatus(connection.id)}
              onDelete={() => window.electronAPI.deleteConnection(connection.id).then(loadConnections)}
              onCreateDatabase={() => {
                setSelectedConnectionForDb(connection);
                setShowCreateDatabaseDialog(true);
              }}
            >
              {renderChildren(nodeId, 'connection', { id: connection.id, connectionId: connection.id })}
            </TreeNode>
          );
        })}
      </>
    );
  };

  const loadConnections = async () => {
    try {
      const conns = await window.electronAPI.getConnections();
      useConnectionStore.getState().setConnections(conns || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
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
            loadConnections();
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
          onDatabaseCreated={async () => {
            setNodeData(new Map());
            loadConnections();
            setShowCreateDatabaseDialog(false);
            setSelectedConnectionForDb(null);
          }}
        />
      )}
    </div>
  );
};

export default DatabaseTree;

