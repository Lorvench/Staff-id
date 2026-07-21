"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import {
  createStaffSchema,
  type CreateStaffInput,
  type CreateStaffFormValues,
} from "@/lib/validation";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import DateField from "@/components/ui/DateField";
import { Input } from "@/components/ui/Field";
import TagPicker from "@/components/admin/TagPicker";
import PhotoUpload from "@/components/admin/PhotoUpload";
import CredentialHandoff from "@/components/admin/CredentialHandoff";
import { extractFieldErrors } from "@/lib/form-errors";

type Meta = { roles: string[]; venues: string[]; nextStfId: string };
type CreateResult = { staff: StaffDetail; tempPassword: string };

const FORM_ID = "new-staff-form";
const today = () => new Date().toISOString().slice(0, 10);

const EMPTY: CreateStaffFormValues = {
  stfId: "",
  name: "",
  email: "",
  photoUrl: "",
  roles: [],
  venues: [],
  dateEngaged: "",
};

/**
 * Staff onboarding, as a slide-over.
 *
 * Creating a staff record also creates the linked login account. The temporary
 * password is generated server-side and shown exactly once on success — there
 * is no email provider in scope, so the admin hands it over directly. That
 * reveal replaces the form inside the drawer rather than navigating away, so
 * the credentials can't be lost to a stray back-button.
 *
 * The form hooks live here rather than in a child that unmounts on close,
 * because the drawer's footer needs to read `formState` and drive submit. That
 * makes the reset explicit: `handleClose` clears both the form and the mutation.
 *
 * Open state lives in `ui-store` so both the topbar's "New Staff" button and the
 * directory's empty state can trigger the same drawer.
 */
export default function NewStaffDrawer() {
  const open = useUiStore((s) => s.newStaffOpen);
  const setOpen = useUiStore((s) => s.setNewStaffOpen);
  const pushToast = useUiStore((s) => s.pushToast);
  const openStaffDrawer = useUiStore((s) => s.openStaffDrawer);
  const queryClient = useQueryClient();

  const meta = useQuery({
    queryKey: ["admin", "meta"],
    queryFn: () => apiClient.get<Meta>("/api/admin/meta"),
    enabled: open,
  });

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateStaffFormValues, unknown, CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { ...EMPTY, dateEngaged: today() },
    // Validate once a field has been visited, so errors appear as the admin
    // works rather than all at once on submit.
    mode: "onTouched",
  });

  const mutation = useMutation({
    mutationFn: (values: CreateStaffInput) =>
      apiClient.post<CreateResult>("/api/admin/staff", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      pushToast("Staff member onboarded.");
    },
    onError: (error) => {
      // The server owns uniqueness (duplicate STF-ID or email), so its field
      // errors land back on the fields themselves.
      for (const [path, message] of Object.entries(extractFieldErrors(error))) {
        setError(path as Path<CreateStaffFormValues>, { type: "server", message });
      }
    },
  });

  const handleClose = () => {
    setOpen(false);
    reset({ ...EMPTY, dateEngaged: today() });
    mutation.reset();
  };

  const generalError =
    mutation.error instanceof ApiClientError &&
    !Object.keys(extractFieldErrors(mutation.error)).length
      ? mutation.error.message
      : "";

  // `useWatch` rather than `watch()` — the latter returns a fresh function each
  // render, which opts the component out of React Compiler memoization.
  const name = useWatch({ control, name: "name" });
  const done = mutation.isSuccess;

  const stfIdField = register("stfId");

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Onboard staff"
      description="Creates the staff record and its login account together. A temporary password is issued once, on save."
      footer={
        done ? null : (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            {/* Outside the <form>, so it submits by id. */}
            <Button type="submit" form={FORM_ID} loading={mutation.isPending}>
              Create staff member
            </Button>
          </div>
        )
      }
    >
      {done ? (
        <CredentialHandoff
          staff={mutation.data.staff}
          email={mutation.variables.email}
          tempPassword={mutation.data.tempPassword}
          // Hand straight over to the record drawer rather than leaving the
          // admin on a directory wondering whether it saved.
          onDone={() => {
            const id = mutation.data.staff.id;
            handleClose();
            openStaffDrawer(id, "view");
          }}
        />
      ) : (
        <form
          id={FORM_ID}
          className="space-y-6"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
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
              id="name"
              label="Full Name"
              error={errors.name?.message}
              placeholder="John Doe"
              {...register("name")}
            />
            <Input
              id="stfId"
              label="Staff ID"
              error={errors.stfId?.message}
              placeholder={meta.data?.nextStfId ?? "STF-000248"}
              className="font-mono"
              {...stfIdField}
              // Uppercase the DOM value, not just the stored one — `setValueAs`
              // would leave the admin looking at lowercase text.
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                return stfIdField.onChange(e);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="email"
              label="Login Email"
              type="email"
              error={errors.email?.message}
              placeholder="john.doe@lhp.com"
              {...register("email")}
            />
            <Controller
              control={control}
              name="dateEngaged"
              render={({ field }) => (
                <DateField
                  id="dateEngaged"
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

          {generalError && (
            <p
              role="alert"
              className="rounded-lg bg-disengaged-soft px-3 py-2 text-sm font-medium text-disengaged-ink"
            >
              {generalError}
            </p>
          )}
        </form>
      )}
    </Drawer>
  );
}
