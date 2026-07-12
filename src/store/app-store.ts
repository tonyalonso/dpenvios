import { create } from 'zustand';

export type AppView = 'home' | 'catalog' | 'product' | 'checkout' | 'orders' | 'admin' | 'account';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'settings';

interface AppState {
  currentView: AppView;
  selectedProductId: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  adminTab: AdminTab;
  setView: (view: AppView) => void;
  selectProduct: (productId: string) => void;
  selectCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setAdminTab: (tab: AdminTab) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentView: 'home',
  selectedProductId: null,
  selectedCategory: null,
  searchQuery: '',
  adminTab: 'dashboard',
  setView: (view) => set({ currentView: view }),
  selectProduct: (productId) => set({ currentView: 'product', selectedProductId: productId }),
  selectCategory: (category) => set({ selectedCategory: category, currentView: 'catalog' }),
  setSearchQuery: (query) => set({ searchQuery: query, currentView: query ? 'catalog' : 'home' }),
  setAdminTab: (tab) => set({ adminTab: tab }),
}));
