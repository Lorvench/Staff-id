"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { icons } from "./nav-config";

/**
 * Admin account menu — one implementation, two placements.
 *
 * `sidebar` pins it to the bottom of the rail and opens upward (desktop).
 * `topbar` is an avatar-only trigger that opens downward, right-aligned — used
 * below `lg`, where the sidebar footer is hidden inside the drawer.
 */
export default function AccountMenu({
  email,
  placement,
  collapsed = false,
  roleLabel = "Administrator",
}: {
  email: string;
  placement: "sidebar" | "topbar";
  collapsed?: boolean;
  /** Shown under the email — "Administrator", "Staff", ... */
  roleLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const logout = useMutation({
    mutationFn: () => apiClient.post("/api/auth/logout"),
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
  });

  // Escape closes the menu and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initials = email.slice(0, 2).toUpperCase();
  const itemCls =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-paper-sunken";

  const panelPosition =
    placement === "topbar"
      ? "right-0 top-full mt-2 w-56"
      : `bottom-full mb-1 ${collapsed ? "left-1 w-52" : "inset-x-0"}`;

  const panel = (
    <>
      {/* Click-away catcher, below the menu but above the page. */}
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
      <div
        role="menu"
        className={`absolute z-50 overflow-hidden rounded-xl border border-paper-sunken bg-paper py-1 shadow-card-lg ${panelPosition}`}
      >
        <div className="border-b border-paper-sunken px-3 pb-2 pt-1.5">
          <p className="truncate text-[13px] font-semibold text-ink">{email}</p>
          <p className="field-label mt-0.5">{roleLabel}</p>
        </div>
        <Link
          href="/reset-password"
          role="menuitem"
          onClick={() => setOpen(false)}
          className={`${itemCls} text-ink-soft`}
        >
          <span className="text-ink-muted">{icons.key}</span>
          Change password
        </Link>
        <button
          type="button"
          role="menuitem"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className={`${itemCls} text-disengaged disabled:opacity-60`}
        >
          <span>{icons.logout}</span>
          {logout.isPending ? "Signing out…" : "Logout"}
        </button>
      </div>
    </>
  );

  const avatar = (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-paper">
      {initials}
    </span>
  );

  if (placement === "topbar") {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account"
          title={email}
        >
          {avatar}
        </button>
        {open && panel}
      </div>
    );
  }

  return (
    <div className="relative mt-auto border-t border-paper-sunken pt-2">
      {open && panel}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? email : undefined}
        className={`flex w-full items-center gap-2.5 rounded-xl py-2 transition-colors hover:bg-paper-sunken ${
          collapsed ? "justify-center px-0" : "px-2"
        }`}
      >
        {avatar}
        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate text-[13px] font-semibold text-ink">{email}</span>
              <span className="field-label mt-0.5">{roleLabel}</span>
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
