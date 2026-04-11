import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Loader } from 'lucide-react';

const TreeNode = ({ 
  id, 
  label, 
  icon, 
  type, 
  context, 
  isExpanded, 
  isLoading, 
  onToggle, 
  onSelect,
  onDelete,
  onRefresh,
  onViewData,
  onCreateDatabase,
  onStartApi,
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

  const menuItems = () => {
    switch (type) {
      case 'connection':
        return [
          { label: '🔌 Expand / Connect', action: () => { onToggle?.(); closeMenu(); } },
          { label: '🔄 Refresh', action: () => { onRefresh?.(); closeMenu(); } },
          { label: '🚀 Start REST API', action: () => { onStartApi?.(); closeMenu(); } },
          { label: '📋 Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } },
          { label: '🗑 Delete Connection', action: () => { onDelete?.(); closeMenu(); }, danger: true },
        ];
      case 'database':
        return [
          { label: '✅ Select Database', action: () => { onSelect?.(); closeMenu(); } },
          { label: '📂 Expand Schemas', action: () => { onToggle?.(); closeMenu(); } },
          { label: '🔄 Refresh', action: () => { onRefresh?.(); closeMenu(); } },
          { label: '📋 Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } },
        ];
      case 'schema':
        return [
          { label: '📂 Expand Tables', action: () => { onToggle?.(); closeMenu(); } },
          { label: '🔄 Refresh', action: () => { onRefresh?.(); closeMenu(); } },
          { label: '📋 Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } },
        ];
      case 'table':
        return [
          { label: '📊 View first 50 rows', action: () => { onViewData?.(50); closeMenu(); } },
          { label: '📊 View first 100 rows', action: () => { onViewData?.(100); closeMenu(); } },
          { label: '📊 View all rows', action: () => { onViewData?.(null); closeMenu(); } },
          { label: '📂 View Columns', action: () => { onToggle?.(); closeMenu(); } },
          { label: '🔄 Refresh', action: () => { onRefresh?.(); closeMenu(); } },
          { label: '📋 Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } },
        ];
      default:
        return [
          { label: '📋 Copy Name', action: () => { navigator.clipboard.writeText(label); closeMenu(); } },
        ];
    }
  };

  return (
    <div className="tree-node" onContextMenu={handleContextMenu}>
      <div 
        className="tree-node-content"
        onClick={handleClick}
      >
        <span className="tree-icon">
          {isLoading ? (
            <Loader size={14} className="spinner" />
          ) : (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>
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