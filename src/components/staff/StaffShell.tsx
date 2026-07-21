"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AccountMenu from "@/components/admin/AccountMenu";
import { staffNavGroups } from "./staff-nav";

/**
 * Staff console frame — the same shell as the admin area, with staff nav and no
 * admin affordances (no directory search, export, or create actions).
 *
 * Reuses `AdminSidebar`, which takes its nav groups as data, so the two areas
 * share one implementation of the rail, the collapse behaviour, and the account
 * menu rather than keeping two copies in sync.
 */
export default function StaffShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  // The store persists with `skipHydration`, so the first client render matches
  // the server (collapsed = false) and the saved value lands right after mount.
  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const title = pathname === "/staff/settings" ? "Settings" : "Dashboard";

  return (
    <div className="flex h-dvh overflow-hidden bg-paper-soft">
      <div
        className={`hidden shrink-0 transition-[width] duration-200 lg:block ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <AdminSidebar
          email={email}
          groups={staffNavGroups}
          homeHref="/staff"
          roleLabel="Staff"
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-paper-sunken bg-paper px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-paper-sunken lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/staff" aria-label="LHP home" className="shrink-0 lg:hidden">
            <Image
              src="/logo.svg"
              alt="LHP — Lion Hospitality Partners"
              width={56}
              height={30}
              priority
            />
          </Link>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
            <span className="truncate text-[13px] font-semibold text-ink">{title}</span>
          </nav>

          <div className="ml-auto flex shrink-0 items-center lg:hidden">
            <AccountMenu email={email} placement="topbar" roleLabel="Staff" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!drawerOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] transform flex-col bg-paper shadow-card-lg transition-transform duration-200 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar
          email={email}
          groups={staffNavGroups}
          homeHref="/staff"
          roleLabel="Staff"
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>
    </div>
  );
}
