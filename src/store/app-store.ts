import { create } from 'zustand';

export type AppView = 'home' | 'catalog' | 'product' | 'checkout' | 'orders' | 'admin' | 'account';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'settings';

interface AppState {
  currentView: AppView;
  selectedProductId: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  adminTab: AdminTab;
  /** Historial de vistas para soportar el botón atrás del móvil. */
  viewHistory: AppView[];
  setView: (view: AppView) => void;
  /** Navega a la vista anterior (botón atrás del móvil). */
  goBack: () => void;
  selectProduct: (productId: string) => void;
  selectCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setAdminTab: (tab: AdminTab) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  currentView: 'home',
  selectedProductId: null,
  selectedCategory: null,
  searchQuery: '',
  adminTab: 'dashboard',
  viewHistory: [],
  setView: (view) => set((state) => ({
    currentView: view,
    viewHistory: [...state.viewHistory, state.currentView].slice(-20),
  })),
  goBack: () => {
    const history = get().viewHistory;
    if (history.length > 0) {
      const prev = history[history.length - 1];
      set({
        currentView: prev,
        viewHistory: history.slice(0, -1),
      });
    } else {
      set({ currentView: 'home' });
    }
  },
  selectProduct: (productId) => set((state) => ({
    currentView: 'product',
    selectedProductId: productId,
    viewHistory: [...state.viewHistory, state.currentView].slice(-20),
  })),
  selectCategory: (category) => set((state) => ({
    selectedCategory: category,
    currentView: 'catalog',
    viewHistory: [...state.viewHistory, state.currentView].slice(-20),
  })),
  setSearchQuery: (query) => set((state) => ({
    searchQuery: query,
    currentView: query ? 'catalog' : 'home',
    viewHistory: query ? [...state.viewHistory, state.currentView].slice(-20) : state.viewHistory,
  })),
  setAdminTab: (tab) => set({ adminTab: tab }),
}));
