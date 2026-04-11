import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConnectionStore = create(
  persist(
    (set, get) => ({
      connections: [],
      activeConnection: null,
      activeDatabase: null,
      activeSchema: null,
      activeTable: null,
      
      setConnections: (connections) => set({ connections }),
      
      addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
      })),
      
      removeConnection: (id) => set((state) => ({
        connections: state.connections.filter(c => c.id !== id)
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
        getItem: (name) => JSON.parse(localStorage.getItem(name)),
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
