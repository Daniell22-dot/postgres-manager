import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Loader, Circle } from 'lucide-react';

const TreeNode = ({ 
  id, 
  label, 
  icon, 
  type, 
  context, 
  isExpanded, 
  isLoading, 
  status, 
  onToggle, 
  onSelect,
  onDelete,
  onRefresh,
  onViewData,
  onCreateDatabase,
  onStartApi,
  onTestStatus,
  children 
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  // Correctly detect if this node has / can have children
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : !!children;

  const handleClick = () => {
    if (onToggle) onToggle();
    if (onSelect) onSelect();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setContextMenu(null);

  const getStatusIcon = () => {
    if (isLoading) return <Loader data-testid="loader" size={12} className="spinner" />;
    
    if (status) {
      if (status.status === 'fine') return <Circle size={10} className="status-fine" />;
      if (status.status === 'error') return <Circle size={10} className="status-error" />;
      if (status.status === 'checking') return <Loader size={10} className="spinner" />;
    }
    
    return <Circle size={10} className="status-unknown" />;
  };

  const menuItems = () => {
    const items = [];
    
    if (type === 'connection') {
      items.push(
        { label: 'Test Server Status', action: () => { onTestStatus?.(); closeMenu(); } },
        { label: 'Expand / Connect', action: () => { onToggle?.(); closeMenu(); } },
        { label: 'Refresh', action: () => { onRefresh?.(); closeMenu(); } },
        { label: 'Start REST API', action: () => { onStartApi?.(); closeMenu(); } },
        { label: 'Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } },
        { label: 'Delete Connection', action: () => { onDelete?.(); closeMenu(); }, danger: true }
      );
    } else if (type === 'database') {
      items.push(
        { label: 'Select Database', action: () => { onSelect?.(); closeMenu(); } },
        { label: 'Expand', action: () => { onToggle?.(); closeMenu(); } },
        { label: 'Refresh', action: () => { onRefresh?.(); closeMenu(); } },
        { label: 'Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } }
      );
    } else if (type === 'schema') {
      items.push(
        { label: 'Expand', action: () => { onToggle?.(); closeMenu(); } },
        { label: 'Refresh', action: () => { onRefresh?.(); closeMenu(); } },
        { label: 'Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } }
      );
    } else if (type === 'table') {
      items.push(
        { label: 'View first 50 rows', action: () => { onViewData?.(50); closeMenu(); } },
        { label: 'View first 100 rows', action: () => { onViewData?.(100); closeMenu(); } },
        { label: 'View all rows', action: () => { onViewData?.(null); closeMenu(); } },
        { label: 'View Columns', action: () => { onToggle?.(); closeMenu(); } },
        { label: 'Refresh', action: () => { onRefresh?.(); closeMenu(); } },
        { label: 'Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } }
      );
    } else if (['extensions-group','schemas-group','tables-group','views-group','functions-group','procedures-group','sequences-group'].includes(type)) {
      items.push(
        { label: 'Expand', action: () => { onToggle?.(); closeMenu(); } },
        { label: 'Refresh', action: () => { onRefresh?.(); closeMenu(); } }
      );
    } else {
      items.push(
        { label: 'Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } }
      );
    }
    
    return items;
  };

  return (
    <div className="tree-node" onContextMenu={handleContextMenu}>
      <div 
        className="tree-node-content"
        onClick={handleClick}
      >
        <span className="tree-icon">
          {isLoading ? (
            <Loader data-testid="loader" size={14} className="spinner" />
          ) : (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>
        {type === 'connection' && (
          <span className="tree-status-icon">
            {getStatusIcon()}
          </span>
        )}
        {icon && <span className="tree-icon">{icon}</span>}
        <span className="tree-label">{label}</span>
        {type === 'table' && context?.estimatedRows && (
          <span className="tree-badge">{Number(context.estimatedRows).toLocaleString()} rows</span>
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
            <span style={{fontSize: '14px', lineHeight: '1'}}>+</span>
          </button>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="tree-children">
          {children}
        </div>
      )}

      {contextMenu && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
            onClick={closeMenu} 
          />
          <div
            className="context-menu"
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
          >
            {menuItems().map((item, i) => (
              <button
                key={i}
                className={`context-menu-item${item.danger ? ' danger' : ''}`}
                onClick={item.action}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TreeNode;

