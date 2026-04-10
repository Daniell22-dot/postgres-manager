import { create } from 'zustand';

export const useQueryStore = create((set, get) => ({
  queryHistory: [],
  savedQueries: [],
  currentQuery: '',
  queryTabs: [{ id: '1', name: 'Query 1', content: '' }],
  activeTabId: '1',
  
  setCurrentQuery: (query) => set({ currentQuery: query }),
  
  addToHistory: (query) => set((state) => ({
    queryHistory: [query, ...state.queryHistory].slice(0, 100)
  })),
  
  addQueryTab: () => set((state) => ({
    queryTabs: [...state.queryTabs, {
      id: Date.now().toString(),
      name: `Query ${state.queryTabs.length + 1}`,
      content: ''
    }]
  })),
  
  removeQueryTab: (id) => set((state) => ({
    queryTabs: state.queryTabs.filter(tab => tab.id !== id),
    activeTabId: state.activeTabId === id ? state.queryTabs[0]?.id : state.activeTabId
  })),
  
  setActiveTab: (id) => set({ activeTabId: id }),
  
  updateTabContent: (id, content) => set((state) => ({
    queryTabs: state.queryTabs.map(tab =>
      tab.id === id ? { ...tab, content } : tab
    )
  })),
  
  saveQuery: (name, sql) => set((state) => ({
    savedQueries: [...state.savedQueries, {
      id: Date.now(),
      name,
      sql,
      createdAt: new Date().toISOString()
    }]
  }))
}));