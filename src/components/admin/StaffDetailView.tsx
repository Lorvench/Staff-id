"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import type { AuditEntry } from "@/lib/types";
import StaffPhoto from "@/components/StaffPhoto";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TagPicker from "@/components/admin/TagPicker";
import PhotoUpload from "@/components/admin/PhotoUpload";
import AuditLogPanel from "@/components/admin/AuditLogPanel";
import { formatLongDate, toDateInputValue } from "@/lib/format";

type Meta = { roles: string[]; venues: string[] };

/**
 * Admin view of one staff record: identity summary, status control, edit form,
 * and audit history. Seeded from a server-rendered record, then kept live by
 * React Query after each mutation.
 */
export default function StaffDetailView({
  initialStaff,
}: {
  initialStaff: StaffDetail;
}) {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const { data: staff = initialStaff } = useQuery({
    queryKey: ["admin", "staff", initialStaff.id],
    queryFn: () => apiClient.get<StaffDetail>(`/api/admin/staff/${initialStaff.id}`),
    initialData: initialStaff,
  });

  const meta = useQuery({
    queryKey: ["admin", "meta"],
    queryFn: () => apiClient.get<Meta>("/api/admin/meta"),
  });

  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [name, setName] = useState(staff.name);
  const [photoUrl, setPhotoUrl] = useState(staff.photoUrl ?? "");
  const [roles, setRoles] = useState<string[]>(staff.roles);
  const [venues, setVenues] = useState<string[]>(staff.venues);
  const [dateEngaged, setDateEngaged] = useState(toDateInputValue(staff.dateEngaged));

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  const save = useMutation({
    mutationFn: () =>
      apiClient.patch<StaffDetail>(`/api/admin/staff/${staff.id}`, {
        name,
        photoUrl,
        roles,
        venues,
        dateEngaged,
      }),
    onSuccess: () => {
      refreshAll();
      setEditing(false);
      pushToast("Changes saved.");
    },
    onError: (error) =>
      pushToast(
        error instanceof ApiClientError ? error.message : "Couldn't save changes.",
        "error",
      ),
  });

  const nextStatus = staff.status === "ACTIVE" ? "DISENGAGED" : "ACTIVE";

  const toggleStatus = useMutation({
    mutationFn: () =>
      apiClient.patch<{ changed: boolean; sessionsRevoked: number }>(
        `/api/admin/staff/${staff.id}/status`,
        { status: nextStatus },
      ),
    onSuccess: (result) => {
      refreshAll();
      setConfirmOpen(false);

      if (!result.changed) {
        pushToast("Status was already up to date.");
      } else if (nextStatus === "DISENGAGED") {
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

  const audit = useQuery({
    queryKey: ["admin", "staff", staff.id, "audit"],
    queryFn: () =>
      apiClient.get<{ entries: AuditEntry[] }>(`/api/admin/staff/${staff.id}/audit`),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-ink-muted transition hover:bg-paper-sunken hover:text-ink"
          aria-label="Back to staff directory"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-ink">Staff record</h1>
      </header>

      {/* Identity summary */}
      <section className="mt-6 rounded-2xl bg-paper p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-5">
          <StaffPhoto src={staff.photoUrl} name={staff.name} size={80} />

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight text-ink">
              {staff.name}
            </h2>
            <p className="mt-0.5 font-mono text-sm text-ink-muted">{staff.stfId}</p>
            <p className="mt-0.5 truncate text-sm text-ink-muted">{staff.email}</p>
          </div>

          <StatusBadge status={staff.status} />
        </div>

        <dl className="mt-6 grid gap-5 border-t border-paper-sunken pt-5 sm:grid-cols-3">
          <div>
            <dt className="field-label">Role(s)</dt>
            <dd className="mt-1 text-sm font-medium text-ink-soft">
              {staff.roles.join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="field-label">Venue(s)</dt>
            <dd className="mt-1 text-sm font-medium text-ink-soft">
              {staff.venues.join(" · ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="field-label">Date Engaged</dt>
            <dd className="mt-1 text-sm font-medium text-ink-soft">
              {formatLongDate(staff.dateEngaged)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-paper-sunken pt-5">
          <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close editor" : "Edit details"}
          </Button>

          <Button
            size="sm"
            variant={staff.status === "ACTIVE" ? "danger" : "primary"}
            onClick={() => setConfirmOpen(true)}
          >
            {staff.status === "ACTIVE" ? "Disengage" : "Reactivate"}
          </Button>

          <a
            href={staff.verificationUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto self-center text-xs font-semibold text-brand hover:underline"
          >
            View public verification →
          </a>
        </div>
      </section>

      {/* Edit form */}
      {editing && (
        <section className="animate-fade-scale-in mt-4 rounded-2xl bg-paper p-6 shadow-card">
          <h2 className="text-base font-bold text-ink">Edit details</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Staff ID is immutable — the QR code and printed badges derive from it.
          </p>

          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <PhotoUpload value={photoUrl} name={name} onChange={setPhotoUrl} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="edit-name"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                id="edit-date"
                label="Date Engaged"
                type="date"
                value={dateEngaged}
                onChange={(e) => setDateEngaged(e.target.value)}
                required
              />
            </div>

            <TagPicker
              label="Role(s)"
              options={meta.data?.roles ?? []}
              value={roles}
              onChange={setRoles}
              placeholder="Add a role…"
            />

            <TagPicker
              label="Venue(s)"
              options={meta.data?.venues ?? []}
              value={venues}
              onChange={setVenues}
              placeholder="Add a venue…"
            />

            <div className="flex justify-end gap-2 border-t border-paper-sunken pt-5">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={save.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Audit log */}
      <AuditLogPanel
        entries={audit.data?.entries ?? []}
        loading={audit.isPending}
      />

      {/* Status confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title={staff.status === "ACTIVE" ? "Disengage staff member?" : "Reactivate staff member?"}
        tone={staff.status === "ACTIVE" ? "danger" : "primary"}
        confirmLabel={staff.status === "ACTIVE" ? "Disengage" : "Reactivate"}
        loading={toggleStatus.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => toggleStatus.mutate()}
        description={
          staff.status === "ACTIVE" ? (
            <>
              <strong className="font-semibold text-ink">{staff.name}</strong>&apos;s ID
              will immediately read as <strong>INVALID</strong> on any public scan, and
              every active session will be signed out at once. This is recorded in the
              audit log.
            </>
          ) : (
            <>
              <strong className="font-semibold text-ink">{staff.name}</strong>&apos;s ID
              will read as <strong>VERIFIED</strong> again. They will be required to set
              a new password at next sign-in.
            </>
          )
        }
      />
    </div>
  );
}
