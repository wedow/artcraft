import { create } from 'zustand';

export type TabId = '2D' | '3D' | 'VIDEO' | 'IMAGE';

interface TabState {
  // Current active tab
  activeTabId: TabId;
  // Tab data stored as stringified JSON
  tabData: {
    [K in TabId]?: string;
  };
  // Actions
  setActiveTab: (tabId: TabId) => void;
  updateTabData: (tabId: TabId, data: unknown) => void;
  getTabData: <T>(tabId: TabId) => T | null;
  clearTabData: (tabId: TabId) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  activeTabId: '2D',
  tabData: {},

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  updateTabData: (tabId, data) => {
    set((state) => ({
      tabData: {
        ...state.tabData,
        [tabId]: JSON.stringify(data)
      }
    }));
  },

  getTabData: <T>(tabId: TabId): T | null => {
    const state = get();
    const data = state.tabData[tabId];
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error parsing tab data for ${tabId}:`, e);
      return null;
    }
  },

  clearTabData: (tabId) => {
    set((state) => {
      const newTabData = { ...state.tabData };
      delete newTabData[tabId];
      return { tabData: newTabData };
    });
  }
}));
