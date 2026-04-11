import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import DatabaseTree from './components/Sidebar/DatabaseTree';
import Editor from './components/QueryEditor/Editor';
import StatusBar from './components/Common/StatusBar';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { useConnectionStore } from './store/connectionStore';
import './styles/app.css';

function App() {
  const { activeConnection, activeDatabase, activeTable, setActiveConnection, setActiveTable} = useConnectionStore();
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const handleSelectDatabase = (connection, database) => {
    setActiveConnection(connection, database);
    setActiveTable(null, null, null); // Clear Table selection
  };

  const handleSelectTable = (connection, database, schema, table) => {
    console.log('Table selected:', connection.name, database, schema, table);
    setActiveConnection(connection, database, schema, table);
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
            <h2>Postgres Manager</h2>
          </div>
          
          <DatabaseTree onSelectDatabase={handleSelectDatabase} />
          
          <div 
            className="resize-handle"
            onMouseDown={() => setIsResizing(true)}
          />
        </div>
        
        <div className="main-content">
          {activeConnection ? (
            <ErrorBoundary key={activeConnection.id}>
              <Editor 
                connection={activeConnection}
                database={activeDatabase}
              />
            </ErrorBoundary>
          ) : (
            <div className="welcome-screen">
              <h1> Welcome to Postgres Manager</h1>
              <p>Click "New Connection" in the sidebar to get started</p>
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
                  <p>Never lose your important queries again</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <StatusBar />
      </div>
      
    </ErrorBoundary>
  );
}

export default App;