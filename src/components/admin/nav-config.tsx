import type { ReactNode } from "react";

/**
 * Admin sidebar navigation.
 *
 * Grouped so the console has room to grow (Reports, Venues, Settings...) without
 * the sidebar turning into a flat wall of links. Every entry here points at a
 * route that actually exists — no placeholder destinations.
 */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const icons = {
  staff: (
    <svg {...iconProps}>
      <path d="M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19" />
      <circle cx="10" cy="8" r="3.2" />
      <path d="M19 19v-1.5a3.5 3.5 0 00-2.6-3.38M15.2 5.2a3.2 3.2 0 010 5.6" />
    </svg>
  ),
  key: (
    <svg {...iconProps}>
      <circle cx="8" cy="14" r="3.5" />
      <path d="M10.6 11.6L18 4.2M15.4 6.8l2 2M13.2 9l2 2" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5M14 5h4a2 2 0 012 2v10a2 2 0 01-2 2h-4" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** `/admin` would prefix-match every child route, so it matches exactly. */
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Directory",
    // Onboarding is a drawer launched from the topbar, not a route, so it has
    // no nav entry.
    items: [{ href: "/admin", label: "Staff", icon: icons.staff, exact: true }],
  },
];

export function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
