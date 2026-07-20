"use client";

import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import StaffPhoto from "@/components/StaffPhoto";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { formatShortDate } from "@/lib/format";

type StaffList = {
  items: StaffDetail[];
  total: number;
  page: number;
  pageCount: number;
};

type Meta = { roles: string[]; venues: string[] };

/**
 * Admin staff directory — search, filter, paginate.
 * Filter state lives in Zustand (client concern); the rows come from React
 * Query (server concern), keyed on the filters so it refetches as they change.
 */
export default function StaffTable() {
  const filters = useUiStore((s) => s.filters);
  const setFilter = useUiStore((s) => s.setFilter);
  const resetFilters = useUiStore((s) => s.resetFilters);

  const meta = useQuery({
    queryKey: ["admin", "meta"],
    queryFn: () => apiClient.get<Meta>("/api/admin/meta"),
  });

  const params = new URLSearchParams({ page: String(filters.page), pageSize: "20" });
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.role) params.set("role", filters.role);
  if (filters.venue) params.set("venue", filters.venue);

  const query = useQuery({
    queryKey: ["admin", "staff", filters],
    queryFn: () => apiClient.get<StaffList>(`/api/admin/staff?${params}`),
    placeholderData: keepPreviousData,
  });

  const hasFilters = Boolean(
    filters.q || filters.status || filters.role || filters.venue,
  );

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Staff Directory</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {query.data
              ? `${query.data.total} staff ${query.data.total === 1 ? "member" : "members"}`
              : "Loading…"}
          </p>
        </div>
        <Link href="/admin/staff/new">
          <Button size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Onboard staff
          </Button>
        </Link>
      </header>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-2xl bg-paper p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Search name, STF-ID, email…"
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          aria-label="Search staff"
        />
        <Select
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value as typeof filters.status)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISENGAGED">Disengaged</option>
        </Select>
        <Select
          value={filters.role}
          onChange={(e) => setFilter("role", e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {meta.data?.roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
        <Select
          value={filters.venue}
          onChange={(e) => setFilter("venue", e.target.value)}
          aria-label="Filter by venue"
        >
          <option value="">All venues</option>
          {meta.data?.venues.map((venue) => (
            <option key={venue} value={venue}>
              {venue}
            </option>
          ))}
        </Select>
      </div>

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="mt-3 text-xs font-semibold text-brand hover:underline"
        >
          Clear filters
        </button>
      )}

      {/* Results */}
      <div className="mt-6">
        {query.isPending && <TableSkeleton />}

        {query.isError && (
          <EmptyState
            title="Couldn't load staff"
            body="Something went wrong fetching the directory."
            action={<Button size="sm" onClick={() => query.refetch()}>Try again</Button>}
          />
        )}

        {query.data && query.data.items.length === 0 && (
          <EmptyState
            title={hasFilters ? "No matches" : "No staff yet"}
            body={
              hasFilters
                ? "No staff member matches these filters."
                : "Onboard your first staff member to get started."
            }
            action={
              hasFilters ? (
                <Button size="sm" variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link href="/admin/staff/new">
                  <Button size="sm">Onboard staff</Button>
                </Link>
              )
            }
          />
        )}

        {query.data && query.data.items.length > 0 && (
          <ul className="space-y-2">
            {query.data.items.map((staff) => (
              <li key={staff.id}>
                <Link
                  href={`/admin/staff/${staff.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-paper p-4 shadow-card transition hover:shadow-card-lg"
                >
                  <StaffPhoto src={staff.photoUrl} name={staff.name} size={48} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{staff.name}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-ink-muted">
                      {staff.stfId}
                    </p>
                  </div>

                  <div className="hidden min-w-0 flex-1 sm:block">
                    <p className="truncate text-sm text-ink-soft">
                      {staff.roles.join(", ") || "—"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {staff.venues.join(", ") || "—"}
                    </p>
                  </div>

                  <div className="hidden text-right lg:block">
                    <p className="field-label">Engaged</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {formatShortDate(staff.dateEngaged)}
                    </p>
                  </div>

                  <StatusBadge status={staff.status} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {query.data && query.data.pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => setFilter("page", filters.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-muted">
            Page {query.data.page} of {query.data.pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page >= query.data.pageCount}
            onClick={() => setFilter("page", filters.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 rounded-2xl bg-paper p-4 shadow-card">
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-paper p-12 text-center shadow-card">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
