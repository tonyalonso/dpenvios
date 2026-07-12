import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  _hydrated: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setHydrated: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  _hydrated: false,
  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === item.productId);
    let newItems: CartItem[];
    if (existing) {
      newItems = items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      newItems = [...items, { ...item, quantity: 1 }];
    }
    set({ items: newItems });
    // Save to localStorage
    try {
      localStorage.setItem('diaz-premium-cart', JSON.stringify({ state: { items: newItems } }));
    } catch {}
  },
  removeItem: (productId) => {
    const newItems = get().items.filter((i) => i.productId !== productId);
    set({ items: newItems });
    try {
      localStorage.setItem('diaz-premium-cart', JSON.stringify({ state: { items: newItems } }));
    } catch {}
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    set({ items: newItems });
    try {
      localStorage.setItem('diaz-premium-cart', JSON.stringify({ state: { items: newItems } }));
    } catch {}
  },
  clearCart: () => {
    set({ items: [] });
    try {
      localStorage.removeItem('diaz-premium-cart');
    } catch {}
  },
  getTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
  setHydrated: () => set({ _hydrated: true }),
}));
