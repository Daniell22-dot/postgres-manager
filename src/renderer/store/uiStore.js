import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark', // 'dark' or 'light'
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      
      // Sidebar
      sidebarWidth: 280,
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      
      // Results Panel
      resultsHeight: 400,
      setResultsHeight: (height) => set({ resultsHeight: height }),
      isResultsPanelVisible: true,
      toggleResultsPanel: () => set((state) => ({ isResultsPanelVisible: !state.isResultsPanelVisible })),
      
      // Query Editor Settings
      editorSettings: {
        fontSize: 14,
        fontFamily: 'monospace',
        wordWrap: 'off',
        minimap: false,
        lineNumbers: 'on',
        renderWhitespace: 'none',
        tabSize: 2
      },
      updateEditorSetting: (key, value) => set((state) => ({
        editorSettings: { ...state.editorSettings, [key]: value }
      })),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, { ...notification, id: Date.now(), timestamp: new Date() }].slice(-50)
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      // Dialog States
      dialogs: {
        connectionDialog: false,
        queryHistoryDialog: false,
        savedQueriesDialog: false,
        settingsDialog: false,
        exportDialog: false,
        importDialog: false
      },
      openDialog: (dialogName) => set((state) => ({
        dialogs: { ...state.dialogs, [dialogName]: true }
      })),
      closeDialog: (dialogName) => set((state) => ({
        dialogs: { ...state.dialogs, [dialogName]: false }
      })),
      
      // Loading States
      loadingStates: {},
      setLoading: (key, isLoading) => set((state) => {
        const newStates = { ...state.loadingStates };
        if (isLoading) {
          newStates[key] = true;
        } else {
          delete newStates[key];
        }
        return { loadingStates: newStates };
      }),
      isLoading: (key) => !!get().loadingStates[key],
      
      // Keyboard Shortcuts
      keyboardShortcuts: {
        executeQuery: 'Ctrl+Enter',
        newQuery: 'Ctrl+N',
        saveQuery: 'Ctrl+S',
        formatQuery: 'Ctrl+Shift+F',
        clearResults: 'Ctrl+Shift+C',
        toggleResults: 'Ctrl+Shift+R'
      },
      updateShortcut: (action, shortcut) => set((state) => ({
        keyboardShortcuts: { ...state.keyboardShortcuts, [action]: shortcut }
      })),
      
      // Recent Connections
      recentConnections: [],
      addRecentConnection: (connection) => set((state) => ({
        recentConnections: [
          { ...connection, lastUsed: new Date().toISOString() },
          ...state.recentConnections.filter(c => c.id !== connection.id)
        ].slice(0, 10)
      })),
      
      // Query Execution Settings
      querySettings: {
        autoCommit: true,
        limitResults: 1000,
        timeoutSeconds: 60,
        confirmBeforeExecute: false,
        showExecutionPlan: false
      },
      updateQuerySetting: (key, value) => set((state) => ({
        querySettings: { ...state.querySettings, [key]: value }
      }))
    }),
    {
      name: 'ui-storage',
      storage: {
        getItem: (name) => JSON.parse(localStorage.getItem(name)),
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        editorSettings: state.editorSettings,
        keyboardShortcuts: state.keyboardShortcuts,
        querySettings: state.querySettings
      })
    }
  )
);