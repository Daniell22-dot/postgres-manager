import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { 
  Play, 
  Square, 
  Save, 
  FolderOpen, 
  History, 
  Download, 
  Settings,
  FormatPaint,
  Trash2,
  Copy,
  Terminal
} from 'lucide-react';
import ResultsGrid from './ResultsGrid';
import QueryTabs from './QueryTabs';
import QueryHistory from './QueryHistory';
import { useDatabaseConnection } from '../../hooks/useDatabaseConnection';
import { useQueryStore } from '../../store/queryStore';
import { useUIStore } from '../../store/uiStore';
import { formatSQL } from '../../utils/sqlFormatter';
import toast from 'react-hot-toast';

const Editor = ({ connection, database }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const editorRef = useRef(null);
  
  const { executeQuery, cancelQuery, isExecuting, currentQuery, results, clearResults } = useDatabaseConnection();
  const { editorSettings, querySettings } = useUIStore();
  const { 
    queryTabs, 
    activeTabId, 
    updateTabContent, 
    addQueryTab, 
    removeQueryTab, 
    setActiveTab,
    saveQuery 
  } = useQueryStore();

  const currentTab = queryTabs.find(tab => tab.id === activeTabId);
  const currentSql = currentTab?.content || '';

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteQuery();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveQuery();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      handleFormatQuery();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => {
      clearResults();
    });
    
    // Focus editor
    editor.focus();
  };

  const handleExecuteQuery = async () => {
    if (!currentSql.trim()) {
      toast.error('No query to execute');
      return;
    }
    
    if (querySettings.confirmBeforeExecute && currentSql.toLowerCase().includes('delete') || 
        currentSql.toLowerCase().includes('drop') || currentSql.toLowerCase().includes('truncate')) {
      const confirmed = window.confirm('⚠️ This query modifies data. Are you sure?');
      if (!confirmed) return;
    }
    
    await executeQuery(connection.id, database, currentSql);
  };

  const handleExecuteExplain = async () => {
    if (!currentSql.trim()) return;
    
    setIsExecutingPlan(true);
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${currentSql}`;
    const result = await executeQuery(connection.id, database, explainQuery);
    
    if (result.success && result.rows[0]) {
      const plan = result.rows[0]['QUERY PLAN'];
      toast.success('Execution plan generated');
      // You can add a modal to show the plan
      console.log('Execution Plan:', plan);
    }
    setIsExecutingPlan(false);
  };

  const handleFormatQuery = () => {
    if (editorRef.current && currentSql) {
      const formatted = formatSQL(currentSql);
      updateTabContent(activeTabId, formatted);
      toast.success('Query formatted');
    }
  };

  const handleSaveQuery = async () => {
    if (!currentSql.trim()) {
      toast.error('No query to save');
      return;
    }
    
    const name = window.prompt('Enter query name:', currentTab?.name || 'New Query');
    if (name) {
      saveQuery(name, currentSql);
      toast.success(`Query "${name}" saved`);
    }
  };

  const handleExportResults = () => {
    if (results && results.rows && results.rows.length > 0) {
      window.electronAPI.exportToCSV(results.rows, `query_results_${Date.now()}`);
      toast.success('Export started');
    } else {
      toast.error('No results to export');
    }
  };

  const handleCopyResults = async () => {
    if (results && results.rows && results.rows.length > 0) {
      const text = JSON.stringify(results.rows.slice(0, 100), null, 2);
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    }
  };

  const handleClearResults = () => {
    clearResults();
    toast.success('Results cleared');
  };

  const handleNewTab = () => {
    addQueryTab();
    toast.success('New query tab created');
  };

  const handleLoadFromHistory = (sql) => {
    updateTabContent(activeTabId, sql);
    setIsHistoryOpen(false);
    toast.success('Query loaded from history');
  };

  const getQueryStatus = () => {
    if (isExecuting) return 'Executing...';
    if (results) {
      if (results.error) return 'Error';
      return `Success - ${results.rowCount?.toLocaleString() || 0} rows in ${(results.duration / 1000).toFixed(2)}s`;
    }
    return 'Ready';
  };

  return (
    <div className="query-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button 
            className={`toolbar-btn ${isExecuting ? 'executing' : ''}`}
            onClick={handleExecuteQuery}
            disabled={isExecuting}
            title="Execute (Ctrl+Enter)"
          >
            {isExecuting ? <Square size={16} /> : <Play size={16} />}
            <span>{isExecuting ? 'Running' : 'Execute'}</span>
          </button>
          
          {isExecuting && (
            <button className="toolbar-btn" onClick={cancelQuery}>
              <Square size={16} />
              <span>Cancel</span>
            </button>
          )}
          
          <button className="toolbar-btn" onClick={handleExecuteExplain} disabled={isExecutingPlan}>
            <Terminal size={16} />
            <span>Explain</span>
          </button>
          
          <div className="toolbar-divider" />
          
          <button className="toolbar-btn" onClick={handleNewTab}>
            <FolderOpen size={16} />
            <span>New Tab</span>
          </button>
          
          <button className="toolbar-btn" onClick={handleSaveQuery}>
            <Save size={16} />
            <span>Save</span>
          </button>
          
          <button className="toolbar-btn" onClick={handleFormatQuery}>
            <FormatPaint size={16} />
            <span>Format</span>
          </button>
          
          <div className="toolbar-divider" />
          
          <button className="toolbar-btn" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
            <History size={16} />
            <span>History</span>
          </button>
          
          {results && results.rows && results.rows.length > 0 && (
            <>
              <button className="toolbar-btn" onClick={handleExportResults}>
                <Download size={16} />
                <span>Export</span>
              </button>
              
              <button className="toolbar-btn" onClick={handleCopyResults}>
                <Copy size={16} />
                <span>Copy</span>
              </button>
              
              <button className="toolbar-btn" onClick={handleClearResults}>
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
        
        <div className="toolbar-right">
          <div className="connection-info">
            <span className="connection-name">{connection.name}</span>
            <span className="database-name">{database}</span>
          </div>
          
          <button className="toolbar-btn" onClick={() => useUIStore.getState().openDialog('settingsDialog')}>
            <Settings size={16} />
          </button>
        </div>
      </div>
      
      {/* Query Tabs */}
      <QueryTabs />
      
      {/* Editor Container */}
      <div className="editor-container">
        <MonacoEditor
          height="100%"
          language="sql"
          theme="vs-dark"
          value={currentSql}
          onChange={(value) => updateTabContent(activeTabId, value || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: editorSettings.fontSize,
            fontFamily: editorSettings.fontFamily,
            wordWrap: editorSettings.wordWrap === 'on' ? 'on' : 'off',
            minimap: { enabled: editorSettings.minimap },
            lineNumbers: editorSettings.lineNumbers,
            renderWhitespace: editorSettings.renderWhitespace,
            tabSize: editorSettings.tabSize,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true }
          }}
        />
      </div>
      
      {/* Status Bar */}
      <div className="editor-status">
        <span className="status-text">{getQueryStatus()}</span>
        {currentSql && (
          <span className="status-text">
            Characters: {currentSql.length} | Lines: {currentSql.split('\n').length}
          </span>
        )}
      </div>
      
      {/* Results Panel */}
      {results && (
        <ResultsGrid 
          results={results}
          onClose={clearResults}
          onExport={handleExportResults}
        />
      )}
      
      {/* History Sidebar */}
      {isHistoryOpen && (
        <QueryHistory 
          connectionId={connection.id}
          onLoadQuery={handleLoadFromHistory}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
      
      <style jsx>{`
        .query-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e2e;
        }
        
        .editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #181825;
          border-bottom: 1px solid #313244;
          gap: 8px;
        }
        
        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #313244;
          border: none;
          border-radius: 6px;
          color: #cdd6f4;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        
        .toolbar-btn:hover:not(:disabled) {
          background: #45475a;
          transform: translateY(-1px);
        }
        
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .toolbar-btn.executing {
          background: #f38ba8;
          color: #1e1e2e;
        }
        
        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #313244;
        }
        
        .connection-info {
          display: flex;
          gap: 8px;
          padding: 4px 12px;
          background: #313244;
          border-radius: 6px;
          font-size: 12px;
        }
        
        .connection-name {
          color: #89b4fa;
          font-weight: 600;
        }
        
        .database-name {
          color: #a6e3a1;
        }
        
        .editor-container {
          flex: 1;
          min-height: 200px;
          position: relative;
        }
        
        .editor-status {
          display: flex;
          justify-content: space-between;
          padding: 4px 12px;
          background: #181825;
          border-top: 1px solid #313244;
          font-size: 11px;
          color: #6c7086;
        }
      `}</style>
    </div>
  );
};

export default Editor;