"use client";

import { create } from "zustand";

/**
 * ---------------------------------------------------------------------------
 * Zustand — CLIENT state only.
 * ---------------------------------------------------------------------------
 * Server state (staff records, audit logs) belongs to React Query. This store
 * holds only things the server has no opinion about: the admin list filters and
 * the transient toast queue. Keeping the split strict is what stops the two
 * libraries from fighting over the same data.
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

  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
};

let toastId = 0;

export const useUiStore = create<UiState>((set) => ({
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

  toasts: [],

  pushToast: (message, tone = "success") =>
    set((state) => ({ toasts: [...state.toasts, { id: ++toastId, message, tone }] })),

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
