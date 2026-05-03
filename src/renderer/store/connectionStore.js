import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LOCAL_SERVERS = [
  {
    id: 'local-postgres',
    name: 'PostgreSQL (Local)',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: '',
    type: 'postgres',
    isLocal: true,
    color: '#a6e3a1',
    ssl_mode: 'prefer'
  },
  {
    id: 'local-mysql',
    name: 'MySQL (Local)',
    host: 'localhost',
    port: 3306,
    database: 'mysql',
    username: 'root',
    password: '',
    type: 'mysql',
    isLocal: true,
    color: '#f9e2af',
    ssl_mode: 'disable'
  }
];

export const useConnectionStore = create(
  persist(
    (set, get) => ({
      connections: [...LOCAL_SERVERS],
      connectionStatuses: {},
      activeConnection: null,
      activeDatabase: null,
      activeSchema: null,
      activeTable: null,
      
      ensureLocalServers: () => {
        set((state) => {
          const hasLocalPg = state.connections.some(c => c.id === 'local-postgres');
          const hasLocalMysql = state.connections.some(c => c.id === 'local-mysql');
          let updatedConnections = [...state.connections];
          
          if (!hasLocalPg) {
            updatedConnections.push(LOCAL_SERVERS[0]);
          }
          if (!hasLocalMysql) {
            updatedConnections.push(LOCAL_SERVERS[1]);
          }
          
          return { connections: updatedConnections };
        });
      },

      setConnections: (connections) => {
        set({ connections });
        get().ensureLocalServers();
      },
      
      addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
      })),
      
      removeConnection: (id) => {
        if (id === 'local-postgres' || id === 'local-mysql') return; // Protect locals
        set((state) => ({
          connections: state.connections.filter(c => c.id !== id),
          connectionStatuses: Object.fromEntries(
            Object.entries(state.connectionStatuses).filter(([key]) => key !== id)
          )
        }));
      },

      testConnectionStatus: async (id) => {
        const connection = get().connections.find(c => c.id === id);
        if (!connection) return 'error';
        
        try {
          let result;
          if (connection.isLocal) {
            result = await window.electronAPI.getServerStatus(connection.type);
          } else {
            result = await window.electronAPI.testConnection(connection);
          }
          
          const status = result.success !== false && result.running !== false ? 'fine' : 'error';
          get().updateStatus(id, status);
          return { status, result };
        } catch (e) {
          get().updateStatus(id, 'error');
          return { status: 'error', result: { error: e.message } };
        }
      },
      
      updateStatus: (id, status) => set((state) => ({
        connectionStatuses: {
          ...state.connectionStatuses,
          [id]: { status, lastChecked: Date.now() }
        }
      })),
      
      setActiveConnection: (connection, database) => set({
        activeConnection: connection,
        activeDatabase: database
      }),

      setActiveTable: (connection, database, schema, table) => set({
        activeTable: table ? { name: table, schema: schema } : null,
        activeDatabase: database || get().activeDatabase,
        activeConnection: connection || get().activeConnection,
        activeSchema: schema || null
      }),
      
      clearActiveConnection: () => set({
        activeConnection: null,
        activeDatabase: null,
        activeSchema: null,
        activeTable: null
      })
    }),
    {
      name: 'connection-store',
      storage: {
        getItem: (name) => JSON.parse(localStorage.getItem(name) || 'null'),
        setItem: (name, value) => {
          // Don't persist passwords for local servers
          const state = value.state || value;
          const sanitized = {
            ...state,
            connections: state.connections.map(c => 
              LOCAL_SERVERS.some(local => local.id === c.id) 
                ? { ...c, password: '' }
                : c
            )
          };
          localStorage.setItem(name, JSON.stringify(sanitized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        ...state,
        connections: state.connections.map(c => ({
          ...c,
          password: c.isLocal ? '' : c.password
        }))
      })
    }
  )
);

