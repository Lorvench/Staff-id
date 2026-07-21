"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/store/ui-store";
import Button from "@/components/ui/Button";
import AccountMenu from "./AccountMenu";
import TopbarSearch from "./TopbarSearch";
import ExportButton from "./ExportButton";

type Crumb = { label: string; href?: string };

/**
 * Breadcrumbs are derived from the pathname rather than pushed up from the page,
 * which keeps the layout free of page-render side effects.
 *
 * Records are drawers now, not routes, so the trail stays shallow — a drawer is
 * an overlay on the directory, and the crumb shouldn't claim you navigated.
 */
function useCrumbs(): Crumb[] {
  const pathname = usePathname();

  if (pathname === "/admin") return [{ label: "Staff Directory" }];

  return [{ label: "Admin" }];
}

export default function AdminTopbar({
  email,
  onMenuClick,
}: {
  email: string;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const crumbs = useCrumbs();
  const setNewStaffOpen = useUiStore((s) => s.setNewStaffOpen);

  const onList = pathname === "/admin";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-paper-sunken bg-paper px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-paper-sunken lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <Link href="/admin" aria-label="LHP admin home" className="shrink-0 lg:hidden">
        <Image
          src="/logo.svg"
          alt="LHP — Lion Hospitality Partners"
          width={56}
          height={30}
          priority
        />
      </Link>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
        <ol className="flex items-center gap-2 text-[13px]">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={crumb.label} className="flex min-w-0 items-center gap-2">
                {i > 0 && (
                  <span aria-hidden className="text-ink-faint">
                    /
                  </span>
                )}
                {crumb.href && !last ? (
                  <Link
                    href={crumb.href}
                    className="truncate text-ink-muted transition-colors hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="truncate font-semibold text-ink"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <TopbarSearch onList={onList} />

        <Button size="sm" onClick={() => setNewStaffOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">New Staff</span>
        </Button>

        <ExportButton />

        <div className="lg:hidden">
          <AccountMenu email={email} placement="topbar" />
        </div>
      </div>
    </header>
  );
}
