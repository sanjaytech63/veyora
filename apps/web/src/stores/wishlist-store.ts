import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string; // product id
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  category?: string;
  stock?: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id);
          if (exists) {
            return { items: state.items.filter((i) => i.id !== item.id) };
          }
          return { items: [...state.items, item] };
        });
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id);
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearWishlist: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: "veyora-wishlist-store",
    }
  )
);
