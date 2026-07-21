"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import StaffPhoto from "@/components/StaffPhoto";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Field";
import { formatShortDate } from "@/lib/format";
import ActionMenu, { type RowAction } from "./ActionMenu";
import AdminTabs from "./AdminTabs";
import FilterDropdown, { type FilterOption } from "./FilterDropdown";
import ImportStaffModal from "./ImportStaffModal";

type StaffList = {
  items: StaffDetail[];
  total: number;
  page: number;
  pageCount: number;
};

type Meta = { roles: string[]; venues: string[] };

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20h4l10-10a2.8 2.8 0 10-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 012-2h9" />
  </svg>
);

const BlockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6 6l12 12" />
  </svg>
);

const RestoreIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <path d="M4 12a8 8 0 108-8 8 8 0 00-5.7 2.4L4 8.5" />
    <path d="M4 4v4.5h4.5" />
  </svg>
);

/**
 * Admin staff directory — search, filter, paginate, and act on a row.
 *
 * Filter state lives in Zustand (client concern); rows come from React Query
 * (server concern), keyed on the filters so it refetches as they change.
 * Filtering and pagination are done by the API, not in the browser, so the
 * table stays cheap on a large directory.
 */
export default function StaffTable() {
  const queryClient = useQueryClient();
  const filters = useUiStore((s) => s.filters);
  const setFilter = useUiStore((s) => s.setFilter);
  const resetFilters = useUiStore((s) => s.resetFilters);
  const pushToast = useUiStore((s) => s.pushToast);
  const setNewStaffOpen = useUiStore((s) => s.setNewStaffOpen);
  const openStaffDrawer = useUiStore((s) => s.openStaffDrawer);

  /** The row awaiting a status-change confirmation. */
  const [pending, setPending] = useState<StaffDetail | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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

  const nextStatus = pending?.status === "ACTIVE" ? "DISENGAGED" : "ACTIVE";

  const toggleStatus = useMutation({
    mutationFn: (staff: StaffDetail) =>
      apiClient.patch<{ changed: boolean; sessionsRevoked: number }>(
        `/api/admin/staff/${staff.id}/status`,
        { status: staff.status === "ACTIVE" ? "DISENGAGED" : "ACTIVE" },
      ),
    onSuccess: (result, staff) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setPending(null);

      if (!result.changed) {
        pushToast("Status was already up to date.");
      } else if (staff.status === "ACTIVE") {
        pushToast(
          result.sessionsRevoked > 0
            ? `Disengaged · ${result.sessionsRevoked} active session${result.sessionsRevoked === 1 ? "" : "s"} revoked.`
            : "Staff member disengaged.",
        );
      } else {
        pushToast("Reactivated · password reset required at next sign-in.");
      }
    },
    onError: (error) =>
      pushToast(
        error instanceof ApiClientError ? error.message : "Couldn't update status.",
        "error",
      ),
  });

  const hasFilters = Boolean(filters.q || filters.status || filters.role || filters.venue);

  const statusOptions: FilterOption[] = [
    { value: "", label: "All statuses" },
    { value: "ACTIVE", label: "Active", dot: "bg-active" },
    { value: "DISENGAGED", label: "Disengaged", dot: "bg-disengaged" },
  ];
  const roleOptions: FilterOption[] = [
    { value: "", label: "All roles" },
    ...(meta.data?.roles ?? []).map((r) => ({ value: r, label: r })),
  ];
  const venueOptions: FilterOption[] = [
    { value: "", label: "All venues" },
    ...(meta.data?.venues ?? []).map((v) => ({ value: v, label: v })),
  ];

  const copyStfId = async (stfId: string) => {
    try {
      await navigator.clipboard.writeText(stfId);
      pushToast(`Copied ${stfId}.`);
    } catch {
      pushToast("Couldn't copy to clipboard.", "error");
    }
  };

  const rowActions = (staff: StaffDetail): RowAction[] => [
    {
      label: "View record",
      icon: <EyeIcon />,
      onClick: () => openStaffDrawer(staff.id, "view"),
    },
    {
      label: "Edit details",
      icon: <EditIcon />,
      onClick: () => openStaffDrawer(staff.id, "edit"),
    },
    {
      label: "Copy STF-ID",
      icon: <CopyIcon />,
      onClick: () => void copyStfId(staff.stfId),
    },
    // Staff records are never hard-deleted — status is the only lifecycle lever.
    staff.status === "ACTIVE"
      ? { label: "Disengage", icon: <BlockIcon />, danger: true, onClick: () => setPending(staff) }
      : { label: "Reactivate", icon: <RestoreIcon />, onClick: () => setPending(staff) },
  ];

  const rows = query.data?.items ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Directory · Staff"
        title="Staff"
        meta={
          query.data
            ? `${query.data.total} staff ${query.data.total === 1 ? "member" : "members"}`
            : "Loading…"
        }
      />

      <div className="mt-5">
        <AdminTabs />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-paper shadow-card">
        {/* Panel header — search left, filters right. The topbar's search pill
            writes to the same `filters.q`, so the two stay in step. */}
        <div className="flex flex-col gap-3 border-b border-paper-sunken px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div className="w-full lg:max-w-xs">
            <Input
              placeholder="Search name, STF-ID, email…"
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              aria-label="Search staff"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              title="Status"
              value={filters.status}
              options={statusOptions}
              onChange={(v) => setFilter("status", v as typeof filters.status)}
            />
            <FilterDropdown
              title="Role"
              value={filters.role}
              options={roleOptions}
              onChange={(v) => setFilter("role", v)}
            />
            <FilterDropdown
              title="Venue"
              value={filters.venue}
              options={venueOptions}
              onChange={(v) => setFilter("venue", v)}
            />
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="px-1 text-[13px] font-semibold text-brand hover:underline"
              >
                Clear
              </button>
            )}

            <span className="mx-1 hidden h-5 w-px bg-paper-sunken sm:block" />

            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-paper-sunken px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-paper-sunken"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              Import CSV
            </button>
          </div>
        </div>

        {/* Body */}
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <Message
            title="Couldn't load staff"
            body="Something went wrong fetching the directory."
            action={<Button size="sm" onClick={() => query.refetch()}>Try again</Button>}
          />
        ) : rows.length === 0 ? (
          <Message
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
                <Button size="sm" onClick={() => setNewStaffOpen(true)}>
                  Onboard staff
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Cards — phones and tablets */}
            <div className="lg:hidden">
              {rows.map((staff) => (
                <div
                  key={staff.id}
                  className={`flex flex-col gap-2 border-t border-paper-sunken px-4 py-4 first:border-t-0 ${
                    staff.status === "DISENGAGED" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openStaffDrawer(staff.id, "view")}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <StaffPhoto src={staff.photoUrl} name={staff.name} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{staff.name}</span>
                        <span className="block truncate font-mono text-[11.5px] text-ink-muted">
                          {staff.stfId}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge status={staff.status} size="sm" />
                      <ActionMenu actions={rowActions(staff)} label={`Actions for ${staff.name}`} />
                    </div>
                  </div>
                  <p className="truncate text-[12.5px] text-ink-soft">
                    {staff.roles.join(", ") || "—"}
                    <span className="text-ink-faint"> · </span>
                    {staff.venues.join(", ") || "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Table — desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">
                    <th className="px-5 py-2.5 font-semibold">Name</th>
                    <th className="px-3 py-2.5 font-semibold">Roles</th>
                    <th className="px-3 py-2.5 font-semibold">Venues</th>
                    <th className="px-3 py-2.5 font-semibold">Engaged</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((staff) => (
                    <tr
                      key={staff.id}
                      className={`border-t border-paper-sunken text-[13.5px] transition-colors hover:bg-paper-soft ${
                        staff.status === "DISENGAGED" ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => openStaffDrawer(staff.id, "view")}
                          className="flex items-center gap-3 text-left"
                        >
                          <StaffPhoto src={staff.photoUrl} name={staff.name} size={32} />
                          <span>
                            <span className="block font-semibold text-ink">{staff.name}</span>
                            <span className="block font-mono text-[11.5px] text-ink-muted">
                              {staff.stfId}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-ink-soft">{staff.roles.join(", ") || "—"}</td>
                      <td className="px-3 py-3 text-ink-soft">{staff.venues.join(", ") || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-muted">
                        {formatShortDate(staff.dateEngaged)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={staff.status} size="sm" />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <ActionMenu
                            actions={rowActions(staff)}
                            label={`Actions for ${staff.name}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer */}
        {query.data && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-paper-sunken px-4 py-3 sm:px-5">
            <span className="text-[12.5px] text-ink-muted">
              {query.data.total} {query.data.total === 1 ? "member" : "members"}
            </span>
            <div className="flex items-center gap-1.5">
              <PageButton
                label="Previous page"
                glyph="‹"
                disabled={filters.page <= 1}
                onClick={() => setFilter("page", filters.page - 1)}
              />
              <span className="px-1 text-[12.5px] text-ink-muted">
                {query.data.page} / {query.data.pageCount}
              </span>
              <PageButton
                label="Next page"
                glyph="›"
                disabled={filters.page >= query.data.pageCount}
                onClick={() => setFilter("page", filters.page + 1)}
              />
            </div>
          </div>
        )}
      </div>

      <ImportStaffModal open={importOpen} onClose={() => setImportOpen(false)} />

      <ConfirmDialog
        open={pending !== null}
        title={nextStatus === "DISENGAGED" ? "Disengage staff member?" : "Reactivate staff member?"}
        description={
          nextStatus === "DISENGAGED" ? (
            <>
              <b className="text-ink">{pending?.name}</b> will be marked disengaged and signed out
              of every active session immediately. Their record is kept.
            </>
          ) : (
            <>
              <b className="text-ink">{pending?.name}</b> will regain access and must set a new
              password at their next sign-in.
            </>
          )
        }
        confirmLabel={nextStatus === "DISENGAGED" ? "Disengage" : "Reactivate"}
        tone={nextStatus === "DISENGAGED" ? "danger" : "primary"}
        loading={toggleStatus.isPending}
        onConfirm={() => pending && toggleStatus.mutate(pending)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function PageButton({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-paper-sunken text-[15px] text-ink-soft transition-colors enabled:hover:bg-paper-sunken disabled:opacity-40"
    >
      {glyph}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-paper-sunken">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-40 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function Message({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
