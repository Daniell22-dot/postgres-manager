import React, { useState, useEffect } from 'react';
import ConnectionDialog from './ConnectionDialog';
import CreateDatabaseDialog from './CreateDatabaseDialog';
import TreeNode from './TreeNode';
import { Database, FolderOpen, Table, Key, Zap, Eye, Cog, Hash, Play } from 'lucide-react';
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
          case 'extensions-group':
            console.log('Loading extensions for database:', nodeContext);
            data = await window.electronAPI.getExtensions(nodeContext.connectionId, nodeContext.database);
            break;
          case 'schemas-group':
            console.log('Loading schemas for database:', nodeContext);
            data = await window.electronAPI.getSchemas(nodeContext.connectionId, nodeContext.database);
            break;
          case 'schema':
            console.log('Loading schema objects for:', nodeContext);
            // For schema, we don't load anything here - we load tables, views, etc separately
            data = [];
            break;
          case 'tables-group':
            console.log('Loading tables for schema:', nodeContext);
            data = await window.electronAPI.getTables(
              nodeContext.connectionId, 
              nodeContext.database, 
              nodeContext.schema
            );
            break;
          case 'views-group':
            console.log('Loading views for schema:', nodeContext);
            data = await window.electronAPI.getViews(
              nodeContext.connectionId,
              nodeContext.database,
              nodeContext.schema
            );
            break;
          case 'functions-group':
            console.log('Loading functions for schema:', nodeContext);
            data = await window.electronAPI.getFunctions(
              nodeContext.connectionId,
              nodeContext.database,
              nodeContext.schema
            );
            break;
          case 'procedures-group':
            console.log('Loading procedures for schema:', nodeContext);
            data = await window.electronAPI.getProcedures(
              nodeContext.connectionId,
              nodeContext.database,
              nodeContext.schema
            );
            break;
          case 'sequences-group':
            console.log('Loading sequences for schema:', nodeContext);
            data = await window.electronAPI.getSequences(
              nodeContext.connectionId,
              nodeContext.database,
              nodeContext.schema
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

  // Create group nodes (grouping UI elements)
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
    
    if (isLoading) {
      return <div className="loading-placeholder">Loading...</div>;
    }
    
    return data.map((item, index) => {
      let nodeId = `${parentId}-${item.name || index}`;
      let icon;
      let childContext = { ...context };
      let nextChildType = null;
      
      switch (childType) {
        case 'connection':
          icon = <Database size={14} />;
          childContext = { 
            id: item.name,
            connectionId: context.id,
            name: item.name, 
            database: item.name,
          };
          // Return a custom structure for databases with groups
          return renderDatabaseNode(context.id, item.name, item);
          
        case 'extensions-group':
        case 'extension':
          icon = <Zap size={14} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '40px' }}>
                {icon}
                <span className="tree-label">{item.name}</span>
              </div>
            </div>
          );
          
        case 'schemas-group':
        case 'schema':
          icon = <FolderOpen size={14} />;
          childContext = {
            connectionId: context.connectionId,
            database: context.database,
            name: item.name,
            schema: item.name
          };
          return renderSchemaNode(parentId, item.name, childContext);
          
        case 'tables-group':
        case 'table':
          icon = <Table size={14} />;
          childContext = {
            connectionId: context.connectionId,
            database: context.database,
            schema: context.schema,
            name: item.name,
            estimatedRows: item.estimated_rows,
            comment: item.comment
          };
          nextChildType = 'column';
          break;
          
        case 'views-group':
        case 'view':
          icon = <Eye size={14} />;
          childContext = {
            connectionId: context.connectionId,
            database: context.database,
            schema: context.schema,
            name: item.name
          };
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '64px' }}>
                {icon}
                <span className="tree-label">{item.name}</span>
              </div>
            </div>
          );
          
        case 'functions-group':
        case 'function':
          icon = <Cog size={14} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '64px' }}>
                {icon}
                <span className="tree-label">{item.name}</span>
              </div>
            </div>
          );
          
        case 'procedures-group':
        case 'procedure':
          icon = <Play size={14} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '64px' }}>
                {icon}
                <span className="tree-label">{item.name}</span>
              </div>
            </div>
          );
          
        case 'sequences-group':
        case 'sequence':
          icon = <Hash size={14} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '64px' }}>
                {icon}
                <span className="tree-label">{item.name}</span>
              </div>
            </div>
          );
          
        case 'column':
          icon = <Key size={12} />;
          return (
            <div key={nodeId} className="tree-node-leaf">
              <div className="tree-node-content" style={{ paddingLeft: '80px' }}>
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
          onRefresh={() => handleRefresh(nodeId, childType, childContext)}
          onViewData={(limit) => handleViewData(childContext, limit)}
          onSelect={() => {
            if (childType === 'table') {
              const connection = connections.find(c => c.id === context.connectionId);
              handleSelectTable(connection, context.database, context.schema, item.name);
            }
          }}
        >
          {nextChildType && renderChildren(nodeId, nextChildType, childContext)}
        </TreeNode>
      );
    });
  };

  // Render a database node with Extensions and Schemas groups
  const renderDatabaseNode = (connectionId, databaseName, database) => {
    const nodeId = `db-${connectionId}-${databaseName}`;
    const dbContext = {
      connectionId,
      id: connectionId,
      name: databaseName,
      database: databaseName
    };
    
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
        onSelect={() => {
          const connection = connections.find(c => c.id === connectionId);
          handleSelectDatabase(connection, databaseName);
        }}
      >
        {expandedNodes.has(nodeId) && (
          <>
            {createGroupNode(nodeId, 'extensions-group', 'Extensions', <Zap size={14} />, dbContext)}
            {createGroupNode(nodeId, 'schemas-group', 'Schemas', <FolderOpen size={14} />, dbContext)}
          </>
        )}
      </TreeNode>
    );
  };

  // Render a schema node with Tables, Views, Functions, etc groups
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
            {createGroupNode(nodeId, 'procedures-group', 'Procedures', <Play size={14} />, schemaContext)}
            {createGroupNode(nodeId, 'sequences-group', 'Sequences', <Hash size={14} />, schemaContext)}
          </>
        )}
      </TreeNode>
    );
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
        {renderChildren(`conn-${connection.id}`, 'connection', { id: connection.id, connectionId: connection.id })}
      </TreeNode>
    ));
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