import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import DatabaseTree from './components/Sidebar/DatabaseTree';
import Editor from './components/QueryEditor/Editor';
import StatusBar from './components/Common/StatusBar';
import ErrorBoundary from './components/Common/ErrorBoundary';
import SettingsDialog from './components/Settings/SettingsDialog';
import { useConnectionStore } from './store/connectionStore';
import { useUIStore } from './store/uiStore';
import { useThemeStore } from './store/themeStore';
import './styles/app.css';

function App() {
  const { activeConnection, activeDatabase, setActiveConnection, setActiveTable } = useConnectionStore();
  const { dialogs, closeDialog } = useUIStore();
  const initTheme = useThemeStore((state) => state.initTheme);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleSelectDatabase = (connection, database) => {
    setActiveConnection(connection, database);
    setActiveTable(null, null, null); // Clear Table selection
  };

  const handleSelectTable = (connection, database, schema, table) => {
    console.log('Table selected:', connection.name, database, schema, table);
    setActiveConnection(connection, database);
    setActiveTable(connection, database, schema, table);
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <ErrorBoundary>
      <div className="app">
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#cdd6f4',
              border: '1px solid #313244'
            }
          }}
        />

        <div className="sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <img
                src="../../../resources/Postgres Manager Logo with Elephant Icon.png"
                alt="Postgres Manager"
                className="sidebar-logo"
              />
              <h2>Postgres Manager</h2>
            </div>
          </div>

          <DatabaseTree
            onSelectDatabase={handleSelectDatabase}
            onSelectTable={handleSelectTable}
          />

          <div
            className="resize-handle"
            onMouseDown={() => setIsResizing(true)}
          />
        </div>

        <div className="main-content">
          {activeConnection && activeDatabase ? (
            <ErrorBoundary key={`${activeConnection.id}-${activeDatabase}`}>
              <Editor
                connection={activeConnection}
                database={activeDatabase}
              />
            </ErrorBoundary>
          ) : (
            <div className="welcome-screen">
              <h1> Welcome to Postgres Manager</h1>
              <p>Click a database in the sidebar to open the query shell and history</p>
              <div className="features">
                <div className="feature">
                  <h3> Fast & Lightweight</h3>
                  <p>Handles 20+ databases without freezing</p>
                </div>
                <div className="feature">
                  <h3> Smart Lazy Loading</h3>
                  <p>Loads only what you need, when you need it</p>
                </div>
                <div className="feature">
                  <h3> Query History</h3>
                  <p>Open any database to access the query editor and history</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <StatusBar />

        {dialogs.settingsDialog && (
          <SettingsDialog onClose={() => closeDialog('settingsDialog')} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
