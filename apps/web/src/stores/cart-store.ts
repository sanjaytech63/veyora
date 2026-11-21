import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // unique key, e.g. `${productId}-${variantId || 'default'}`
  productId: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  color?: string;
  size?: string;
  sku?: string;
  quantity: number;
  maxStock?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          if (existingIndex > -1) {
            const nextItems = [...state.items];
            const existing = nextItems[existingIndex]!;
            const max = item.maxStock ?? 99;
            const newQty = Math.min(existing.quantity + quantity, max);
            nextItems[existingIndex] = { ...existing, quantity: newQty };
            return { items: nextItems };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const max = item.maxStock ?? 99;
              return { ...item, quantity: Math.min(quantity, max) };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: "veyora-cart-store",
    }
  )
);
