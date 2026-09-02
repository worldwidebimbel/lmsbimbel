"use client";

import { create } from "zustand";

interface SidebarState {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  mobileOpen: false,
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
  toggle: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}));
