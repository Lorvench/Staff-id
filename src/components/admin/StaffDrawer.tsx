"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import type { AuditEntry } from "@/lib/types";
import {
  editStaffFormSchema,
  type EditStaffFormInput,
  type EditStaffFormValues,
} from "@/lib/validation";
import { extractFieldErrors } from "@/lib/form-errors";
import StaffPhoto from "@/components/StaffPhoto";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Drawer from "@/components/ui/Drawer";
import DateField from "@/components/ui/DateField";
import { Input } from "@/components/ui/Field";
import TagPicker from "@/components/admin/TagPicker";
import PhotoUpload from "@/components/admin/PhotoUpload";
import AuditLogPanel from "@/components/admin/AuditLogPanel";
import { formatLongDate, toDateInputValue } from "@/lib/format";

type Meta = { roles: string[]; venues: string[] };

const FORM_ID = "edit-staff-form";

const EMPTY: EditStaffFormValues = {
  name: "",
  photoUrl: "",
  roles: [],
  venues: [],
  dateEngaged: "",
};

/**
 * One staff record as a slide-over: read view, edit form, and the status
 * control. Which record and which mode both live in `ui-store`, so a row action
 * anywhere in the directory can open it.
 *
 * The edit form's hooks live at this level because the drawer footer holds the
 * Save/Cancel buttons and needs to drive them. RHF's `values` (not
 * `defaultValues`) seeds the fields, so they refill once the record arrives and
 * whenever a different record is opened.
 *
 * The disengage/reactivate confirmation is a modal, deliberately — it is the one
 * irreversible-feeling action here, and it renders as a *sibling* of the drawer
 * rather than a child. A `Drawer` panel is transformed, which would otherwise
 * make it the containing block for the dialog's `position: fixed`.
 */
export default function StaffDrawer() {
  const drawer = useUiStore((s) => s.staffDrawer);
  const closeDrawer = useUiStore((s) => s.closeStaffDrawer);
  const setMode = useUiStore((s) => s.setStaffDrawerMode);
  const pushToast = useUiStore((s) => s.pushToast);
  const queryClient = useQueryClient();

  const [confirming, setConfirming] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "staff", drawer?.id],
    queryFn: () => apiClient.get<StaffDetail>(`/api/admin/staff/${drawer?.id}`),
    enabled: Boolean(drawer?.id),
  });

  const meta = useQuery({
    queryKey: ["admin", "meta"],
    queryFn: () => apiClient.get<Meta>("/api/admin/meta"),
    enabled: Boolean(drawer),
  });

  const staff = query.data;
  const editing = drawer?.mode === "edit";

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EditStaffFormValues, unknown, EditStaffFormInput>({
    resolver: zodResolver(editStaffFormSchema),
    defaultValues: EMPTY,
    // `values` re-seeds when the record loads or a different one is opened —
    // `defaultValues` alone would keep the first record's data.
    values: staff
      ? {
          name: staff.name,
          photoUrl: staff.photoUrl ?? "",
          roles: staff.roles,
          venues: staff.venues,
          dateEngaged: toDateInputValue(staff.dateEngaged),
        }
      : EMPTY,
    mode: "onTouched",
  });

  const save = useMutation({
    mutationFn: (values: EditStaffFormInput) =>
      apiClient.patch<StaffDetail>(`/api/admin/staff/${staff?.id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      pushToast("Changes saved.");
      setMode("view");
    },
    onError: (error) => {
      const fieldErrors = extractFieldErrors(error);
      for (const [path, message] of Object.entries(fieldErrors)) {
        setError(path as Path<EditStaffFormValues>, { type: "server", message });
      }
      if (!Object.keys(fieldErrors).length) {
        pushToast(
          error instanceof ApiClientError ? error.message : "Couldn't save changes.",
          "error",
        );
      }
    },
  });

  const toggleStatus = useMutation({
    mutationFn: () =>
      apiClient.patch<{ changed: boolean; sessionsRevoked: number }>(
        `/api/admin/staff/${staff?.id}/status`,
        { status: staff?.status === "ACTIVE" ? "DISENGAGED" : "ACTIVE" },
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setConfirming(false);

      if (!result.changed) {
        pushToast("Status was already up to date.");
      } else if (staff?.status === "ACTIVE") {
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

  const name = useWatch({ control, name: "name" });

  const description = staff
    ? editing
      ? "Staff ID is immutable — the QR code and printed badges derive from it."
      : `${staff.stfId} · ${staff.email}`
    : "Loading record…";

  return (
    <>
      <Drawer
        open={drawer !== null}
        onClose={closeDrawer}
        title={editing ? "Edit staff details" : staff?.name || "Staff record"}
        description={description}
        footer={
          staff && (
            <div className="flex items-center justify-end gap-2">
              {editing ? (
                <>
                  <Button type="button" variant="secondary" onClick={() => setMode("view")}>
                    Cancel
                  </Button>
                  <Button type="submit" form={FORM_ID} loading={save.isPending}>
                    Save changes
                  </Button>
                </>
              ) : (
                <>
                  <a
                    href={staff.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-auto text-xs font-semibold text-brand hover:underline"
                  >
                    View public verification →
                  </a>
                  <Button
                    variant={staff.status === "ACTIVE" ? "danger" : "primary"}
                    onClick={() => setConfirming(true)}
                  >
                    {staff.status === "ACTIVE" ? "Disengage" : "Reactivate"}
                  </Button>
                  <Button variant="secondary" onClick={() => setMode("edit")}>
                    Edit details
                  </Button>
                </>
              )}
            </div>
          )
        }
      >
        {query.isPending && <DrawerSkeleton />}

        {query.isError && (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-muted">Couldn&apos;t load this record.</p>
            <div className="mt-4 flex justify-center">
              <Button size="sm" onClick={() => query.refetch()}>
                Try again
              </Button>
            </div>
          </div>
        )}

        {staff &&
          (editing ? (
            <form
              id={FORM_ID}
              className="space-y-5"
              onSubmit={handleSubmit((values) => save.mutate(values))}
            >
              <Controller
                control={control}
                name="photoUrl"
                render={({ field }) => (
                  <PhotoUpload value={field.value ?? ""} name={name} onChange={field.onChange} />
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="edit-name"
                  label="Full Name"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Controller
                  control={control}
                  name="dateEngaged"
                  render={({ field }) => (
                    <DateField
                      id="edit-date"
                      label="Date Engaged"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.dateEngaged?.message}
                      required
                    />
                  )}
                />
              </div>

              <Controller
                control={control}
                name="roles"
                render={({ field }) => (
                  <TagPicker
                    label="Role(s)"
                    options={meta.data?.roles ?? []}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Add a role…"
                  />
                )}
              />

              <Controller
                control={control}
                name="venues"
                render={({ field }) => (
                  <TagPicker
                    label="Venue(s)"
                    options={meta.data?.venues ?? []}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Add a venue…"
                  />
                )}
              />
            </form>
          ) : (
            <ViewStaffPanel staff={staff} />
          ))}
      </Drawer>

      <ConfirmDialog
        open={confirming && Boolean(staff)}
        title={staff?.status === "ACTIVE" ? "Disengage staff member?" : "Reactivate staff member?"}
        tone={staff?.status === "ACTIVE" ? "danger" : "primary"}
        confirmLabel={staff?.status === "ACTIVE" ? "Disengage" : "Reactivate"}
        loading={toggleStatus.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => toggleStatus.mutate()}
        description={
          staff?.status === "ACTIVE" ? (
            <>
              <strong className="font-semibold text-ink">{staff?.name}</strong>&apos;s ID
              will immediately read as <strong>INVALID</strong> on any public scan, and
              every active session will be signed out at once. This is recorded in the
              audit log.
            </>
          ) : (
            <>
              <strong className="font-semibold text-ink">{staff?.name}</strong>&apos;s ID
              will read as <strong>VERIFIED</strong> again. They will be required to set
              a new password at next sign-in.
            </>
          )
        }
      />
    </>
  );
}

/** Read view — identity, assignment, and the record's change history. */
function ViewStaffPanel({ staff }: { staff: StaffDetail }) {
  const audit = useQuery({
    queryKey: ["admin", "staff", staff.id, "audit"],
    queryFn: () =>
      apiClient.get<{ entries: AuditEntry[] }>(`/api/admin/staff/${staff.id}/audit`),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <StaffPhoto src={staff.photoUrl} name={staff.name} size={72} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-bold text-ink">{staff.name}</h3>
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

      <AuditLogPanel entries={audit.data?.entries ?? []} loading={audit.isPending} />
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-5">
        <div className="skeleton h-[72px] w-[72px] rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-44 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-3 w-40 rounded" />
        </div>
      </div>
      <div className="mt-6 grid gap-5 border-t border-paper-sunken pt-5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
