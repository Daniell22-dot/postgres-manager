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

  // Handle error results
  if (results.error) {
    return (
      <div className="results-panel" style={{ height: 'auto', minHeight: '80px' }}>
        <div className="results-header">
          <div className="results-info">
            <span className="results-title">Error</span>
            {results.duration && (
              <span className="results-stats">
                {(results.duration / 1000).toFixed(2)}s
              </span>
            )}
          </div>
          <div className="results-actions">
            <button className="action-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="query-message error-message">
          <span>{results.error}</span>
        </div>
      </div>
    );
  }

  // Handle non-SELECT results (CREATE, INSERT, UPDATE, DELETE, DROP, ALTER, etc.)
  if (!results.fields || results.fields.length === 0) {
    return (
      <div className="results-panel" style={{ height: 'auto', minHeight: '80px' }}>
        <div className="results-header">
          <div className="results-info">
            <span className="results-title">Results</span>
            <span className="results-stats">
              {results.command && `${results.command}`}
              {results.duration && ` · ${(results.duration / 1000).toFixed(2)}s`}
            </span>
          </div>
          <div className="results-actions">
            <button className="action-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="query-message success-message">
          <span>
            {results.command === 'INSERT' && `${results.rowCount ?? 0} row(s) inserted successfully.`}
            {results.command === 'UPDATE' && `${results.rowCount ?? 0} row(s) updated successfully.`}
            {results.command === 'DELETE' && `${results.rowCount ?? 0} row(s) deleted successfully.`}
            {results.command === 'CREATE' && 'Table/object created successfully.'}
            {results.command === 'DROP' && 'Table/object dropped successfully.'}
            {results.command === 'ALTER' && 'Table/object altered successfully.'}
            {!['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'].includes(results.command) && 
              `${results.command || 'Query'} executed successfully.`}
          </span>
        </div>
      </div>
    );
  }

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
      

    </div>
  );
};

export default ResultsGrid;