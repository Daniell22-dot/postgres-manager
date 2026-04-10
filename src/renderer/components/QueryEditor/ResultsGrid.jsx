import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { X, ChevronUp, ChevronDown, Copy, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

const ResultsGrid = ({ results, onClose, onExport }) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [isMaximized, setIsMaximized] = useState(false);
  const { resultsHeight, setResultsHeight, isResultsPanelVisible } = useUIStore();
  
  const [isResizing, setIsResizing] = useState(false);

  const rows = useMemo(() => {
    if (!results.rows) return [];
    
    let data = [...results.rows];
    
    // Apply sorting
    if (sortColumn) {
      data.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    
    return data;
  }, [results.rows, sortColumn, sortDirection]);

  const columns = useMemo(() => {
    if (!results.fields) return [];
    return results.fields.map(field => field.name);
  }, [results.fields]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCopyCell = (value) => {
    navigator.clipboard.writeText(String(value));
    toast.success('Copied to clipboard');
  };

  const handleResizeMouseMove = (e) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight - 200) {
        setResultsHeight(newHeight);
      }
    }
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [isResizing]);

  const RowRenderer = ({ index, style }) => {
    const row = rows[index];
    return (
      <div className="grid-row" style={style}>
        <div className="grid-cell index-cell">{index + 1}</div>
        {columns.map((col, colIndex) => (
          <div 
            key={colIndex} 
            className="grid-cell"
            title={String(row[col])}
            onDoubleClick={() => handleCopyCell(row[col])}
          >
            {row[col] === null ? (
              <span className="null-value">NULL</span>
            ) : typeof row[col] === 'object' ? (
              <span className="object-value">{JSON.stringify(row[col])}</span>
            ) : (
              String(row[col])
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isResultsPanelVisible) return null;

  return (
    <div className="results-panel" style={{ height: isMaximized ? '100%' : resultsHeight }}>
      {/* Header */}
      <div className="results-header">
        <div className="results-info">
          <span className="results-title">Results</span>
          <span className="results-stats">
            {rows.length.toLocaleString()} rows
            {results.duration && ` · ${(results.duration / 1000).toFixed(2)}s`}
            {results.command && ` · ${results.command}`}
          </span>
        </div>
        
        <div className="results-actions">
          <button className="action-btn" onClick={() => setIsMaximized(!isMaximized)}>
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button className="action-btn" onClick={onExport}>
            <Download size={14} />
          </button>
          <button className="action-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="grid-header">
        <div className="grid-cell index-cell">#</div>
        {columns.map((col, index) => (
          <div 
            key={index} 
            className="grid-cell sortable"
            onClick={() => handleSort(col)}
          >
            {col}
            {sortColumn === col && (
              <span className="sort-icon">
                {sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Data Grid */}
      <div className="grid-body">
        {rows.length === 0 ? (
          <div className="no-results">No data to display</div>
        ) : (
          <List
            height={resultsHeight - 80}
            itemCount={rows.length}
            itemSize={35}
            width="100%"
          >
            {RowRenderer}
          </List>
        )}
      </div>
      
      {/* Resize Handle */}
      <div 
        className="resize-handle-horizontal"
        onMouseDown={() => setIsResizing(true)}
      />
      
      <style jsx>{`
        .results-panel {
          position: relative;
          background: #11111b;
          border-top: 1px solid #313244;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #181825;
          border-bottom: 1px solid #313244;
        }
        
        .results-info {
          display: flex;
          gap: 12px;
          align-items: baseline;
        }
        
        .results-title {
          font-weight: 600;
          color: #89b4fa;
        }
        
        .results-stats {
          font-size: 12px;
          color: #6c7086;
        }
        
        .results-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6c7086;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: #313244;
          color: #cdd6f4;
        }
        
        .grid-header {
          display: flex;
          background: #181825;
          border-bottom: 1px solid #313244;
          font-weight: 600;
          font-size: 12px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .grid-body {
          flex: 1;
          overflow: hidden;
          font-size: 12px;
        }
        
        .grid-row {
          display: flex;
          border-bottom: 1px solid #1a1a2e;
        }
        
        .grid-row:hover {
          background: #1e1e2e;
        }
        
        .grid-cell {
          flex: 1;
          padding: 8px 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 100px;
          border-right: 1px solid #1a1a2e;
        }
        
        .index-cell {
          min-width: 60px;
          flex: 0 0 60px;
          background: #181825;
          color: #6c7086;
          text-align: center;
        }
        
        .sortable {
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .sortable:hover {
          background: #313244;
        }
        
        .sort-icon {
          display: inline-flex;
          align-items: center;
        }
        
        .null-value {
          color: #6c7086;
          font-style: italic;
        }
        
        .object-value {
          color: #f9e2af;
          font-family: monospace;
        }
        
        .no-results {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #6c7086;
        }
        
        .resize-handle-horizontal {
          position: absolute;
          top: -4px;
          left: 0;
          right: 0;
          height: 8px;
          cursor: row-resize;
          background: transparent;
          transition: background 0.2s;
        }
        
        .resize-handle-horizontal:hover {
          background: #89b4fa;
        }
      `}</style>
    </div>
  );
};

export default ResultsGrid;