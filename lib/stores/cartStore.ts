'use client';
import { create } from 'zustand';
import type { Cart, CartItem } from '../types';

interface CartState {
  cart: Cart;
  isOpen: boolean;
  isLoading: boolean;
  setCart: (cart: Cart) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setLoading: (v: boolean) => void;
  itemCount: () => number;
}

const emptyCart: Cart = { id: null, items: [], subtotal: 0 };

export const useCartStore = create<CartState>((set, get) => ({
  cart:      emptyCart,
  isOpen:    false,
  isLoading: false,
  setCart:    (cart) => set({ cart }),
  openCart:   () => set({ isOpen: true }),
  closeCart:  () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  setLoading: (isLoading) => set({ isLoading }),
  itemCount:  () => get().cart.items.reduce((n, i) => n + (i as CartItem).quantity, 0),
}));
