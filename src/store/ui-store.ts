"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * ---------------------------------------------------------------------------
 * Zustand — CLIENT state only.
 * ---------------------------------------------------------------------------
 * Server state (staff records, audit logs) belongs to React Query. This store
 * holds only things the server has no opinion about: the admin list filters,
 * the sidebar collapse preference, and the transient toast queue. Keeping the
 * split strict is what stops the two libraries from fighting over the same data.
 *
 * Only `sidebarCollapsed` is persisted — filters and toasts are per-visit. The
 * store uses `skipHydration` so the first client render matches the server
 * (collapsed = false); `AdminShell` calls `rehydrate()` in an effect.
 * ---------------------------------------------------------------------------
 */

export type StaffFilters = {
  q: string;
  status: "" | "ACTIVE" | "DISENGAGED";
  role: string;
  venue: string;
  page: number;
};

const EMPTY_FILTERS: StaffFilters = {
  q: "",
  status: "",
  role: "",
  venue: "",
  page: 1,
};

type Toast = { id: number; message: string; tone: "success" | "error" };

type UiState = {
  filters: StaffFilters;
  /** Patching any filter except `page` resets pagination to page 1. */
  setFilter: <K extends keyof StaffFilters>(key: K, value: StaffFilters[K]) => void;
  resetFilters: () => void;

  /** Desktop sidebar rail vs. full width. Persisted across visits. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  /** Onboarding slide-over. Opened from the topbar and the empty directory. */
  newStaffOpen: boolean;
  setNewStaffOpen: (open: boolean) => void;

  /** Record slide-over — which staff member, and whether it's read or edit. */
  staffDrawer: { id: string; mode: "view" | "edit" } | null;
  openStaffDrawer: (id: string, mode?: "view" | "edit") => void;
  setStaffDrawerMode: (mode: "view" | "edit") => void;
  closeStaffDrawer: () => void;

  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
};

let toastId = 0;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      filters: EMPTY_FILTERS,

      setFilter: (key, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
            ...(key === "page" ? {} : { page: 1 }),
          },
        })),

      resetFilters: () => set({ filters: EMPTY_FILTERS }),

      sidebarCollapsed: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      newStaffOpen: false,

      setNewStaffOpen: (open) => set({ newStaffOpen: open }),

      staffDrawer: null,

      openStaffDrawer: (id, mode = "view") => set({ staffDrawer: { id, mode } }),

      setStaffDrawerMode: (mode) =>
        set((state) =>
          state.staffDrawer ? { staffDrawer: { ...state.staffDrawer, mode } } : {},
        ),

      closeStaffDrawer: () => set({ staffDrawer: null }),

      toasts: [],

      pushToast: (message, tone = "success") =>
        set((state) => ({ toasts: [...state.toasts, { id: ++toastId, message, tone }] })),

      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "lhp-staff-id-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
      skipHydration: true,
    },
  ),
);
