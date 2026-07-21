import type { NavGroup } from "@/components/admin/nav-config";

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

const DashboardIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
  </svg>
);

const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.56V21a2 2 0 11-4 0v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.56-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.56V3a2 2 0 114 0v.1A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.56 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </svg>
);

/** Staff-side navigation. Mirrors the admin nav shape so both share a sidebar. */
export const staffNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/staff", label: "Dashboard", icon: <DashboardIcon />, exact: true },
    ],
  },
  {
    label: "Configurations",
    items: [{ href: "/staff/settings", label: "Settings", icon: <SettingsIcon /> }],
  },
];
