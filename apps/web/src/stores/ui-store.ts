import { create } from "zustand";

interface UIState {
  mobileNavOpen: boolean;
  searchModalOpen: boolean;
  cartDrawerOpen: boolean;
  announcementDismissed: boolean;
  setMobileNavOpen: (open: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  dismissAnnouncement: () => void;
  resetUI: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  searchModalOpen: false,
  cartDrawerOpen: false,
  announcementDismissed: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSearchModalOpen: (open) => set({ searchModalOpen: open }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  dismissAnnouncement: () => set({ announcementDismissed: true }),
  resetUI: () =>
    set({
      mobileNavOpen: false,
      searchModalOpen: false,
      cartDrawerOpen: false,
    }),
}));
