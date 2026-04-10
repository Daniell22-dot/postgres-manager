import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useConnectionStore = create(
  persist(
    (set, get) => ({
      connections: [],
      activeConnection: null,
      activeDatabase: null,
      
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
      
      clearActiveConnection: () => set({
        activeConnection: null,
        activeDatabase: null
      })
    }),
    {
      name: 'connection-store',
      getStorage: () => localStorage
    }
  )
);
