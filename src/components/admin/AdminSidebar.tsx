"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type NavGroup } from "./nav-config";
import AccountMenu from "./AccountMenu";

/**
 * Sidebar body — shared by the desktop rail and the mobile drawer, and by both
 * the admin and staff areas. Nav content comes in via `groups` so the two areas
 * differ only in data, not in another copy of this layout.
 *
 * `onToggleCollapse` is omitted in the drawer, which is always full width.
 */
export default function AdminSidebar({
  email,
  groups,
  homeHref,
  roleLabel,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  email: string;
  /** Nav sections to render, in order. */
  groups: NavGroup[];
  /** Where the logo links to — the area's own root. */
  homeHref: string;
  roleLabel: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col border-r border-paper-sunken bg-paper px-3 py-4">
      <div
        className={`mb-2 flex items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}
      >
        {!collapsed && (
          <Link href={homeHref} aria-label="LHP home" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="LHP — Lion Hospitality Partners"
              width={60}
              height={32}
              priority
            />
          </Link>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
          >
            {/* Panel-left glyph — same mark in both states, since it toggles. */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <path d="M9.5 4v16" />
            </svg>
          </button>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.label} className="mb-1">
          {collapsed ? (
            <div className="mx-2 mb-2 mt-3 border-t border-paper-sunken" />
          ) : (
            <p className="field-label px-3 pb-1.5 pt-3">{group.label}</p>
          )}

          {group.items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`mb-0.5 flex items-center gap-3 rounded-lg py-2 text-[13.5px] font-medium transition-colors ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  active
                    ? "bg-[#f4f4f5] text-ink"
                    : "text-ink-soft hover:bg-paper-sunken hover:text-ink"
                }`}
              >
                <span
                  className={`grid w-5 shrink-0 place-items-center ${
                    active ? "text-brand" : "text-ink-muted"
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      <AccountMenu
        email={email}
        placement="sidebar"
        collapsed={collapsed}
        roleLabel={roleLabel}
      />
    </nav>
  );
}
