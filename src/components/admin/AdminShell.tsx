"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/ui-store";
import AdminSidebar from "./AdminSidebar";
import { navGroups } from "./nav-config";
import AdminTopbar from "./AdminTopbar";
import NewStaffDrawer from "./NewStaffDrawer";
import StaffDrawer from "./StaffDrawer";

/**
 * Admin console frame.
 *
 * Desktop (lg+): a static sidebar that collapses to a 72px icon rail, with the
 * preference persisted. Below lg: the sidebar becomes an off-canvas drawer
 * behind a hamburger in a compact top bar.
 */
export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  // The store persists with `skipHydration`, so the first client render matches
  // the server (collapsed = false) and the saved value lands right after mount.
  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  // Lock body scroll while the drawer is open.
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

  return (
    <div className="flex h-dvh overflow-hidden bg-paper-soft">
      {/* Desktop rail */}
      <div
        className={`hidden shrink-0 transition-[width] duration-200 lg:block ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <AdminSidebar
          email={email}
          groups={navGroups}
          homeHref="/admin"
          roleLabel="Administrator"
          collapsed={collapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar email={email} onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Drawer backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Off-canvas drawer */}
      <aside
        aria-hidden={!drawerOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] transform flex-col bg-paper shadow-card-lg transition-transform duration-200 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar
          email={email}
          groups={navGroups}
          homeHref="/admin"
          roleLabel="Administrator"
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      {/* Mounted once here so any screen can open them through the store. */}
      <NewStaffDrawer />
      <StaffDrawer />
    </div>
  );
}
