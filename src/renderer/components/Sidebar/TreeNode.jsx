import React from 'react';
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
  children 
}) => {
  const hasChildren = children && (typeof children === 'object' ? Object.keys(children).length > 0 : true);
  
  return (
    <div className="tree-node">
      <div 
        className="tree-node-content"
        onClick={() => {
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
            <Loader size={14} className="spinner" />
          ) : hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        {icon && <span className="tree-icon">{icon}</span>}
        <span className="tree-label">{label}</span>
        {type === 'table' && context.estimatedRows && (
          <span className="tree-badge">{context.estimatedRows.toLocaleString()} rows</span>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="tree-children">
          {children}
        </div>
      )}
    </div>
  );
};

export default TreeNode;