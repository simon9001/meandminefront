import { create } from 'zustand';

interface CartDrawerState {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

// Drawer UI state only — cart data lives in RTK Query (backend-synced)
export const useCart = create<CartDrawerState>()((set) => ({
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
