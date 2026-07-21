"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; exact?: boolean };

const TABS: Tab[] = [
  // `/admin` would prefix-match the others, so it matches exactly.
  { href: "/admin", label: "Staff", exact: true },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/venues", label: "Venues" },
];

/**
 * Section tabs under the page title. These are real routes rather than local
 * state, so each section is linkable and survives a refresh.
 */
export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Directory sections" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-[13.5px] font-medium transition-colors ${
              active
                ? "bg-brand text-white"
                : "border border-paper-sunken bg-paper text-ink-soft hover:bg-paper-sunken hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
