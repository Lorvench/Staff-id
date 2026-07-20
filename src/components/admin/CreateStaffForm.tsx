"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import type { StaffDetail } from "@/lib/staff-service";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import TagPicker from "@/components/admin/TagPicker";
import PhotoUpload from "@/components/admin/PhotoUpload";
import CredentialHandoff from "@/components/admin/CredentialHandoff";

type Meta = { roles: string[]; venues: string[]; nextStfId: string };
type CreateResult = { staff: StaffDetail; tempPassword: string };

/**
 * Staff onboarding.
 *
 * Creating a staff record also creates the linked login account. The temporary
 * password is generated server-side and shown exactly once on success — there
 * is no email provider in scope, so the admin hands it over directly.
 */
export default function CreateStaffForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const meta = useQuery({
    queryKey: ["admin", "meta"],
    queryFn: () => apiClient.get<Meta>("/api/admin/meta"),
  });

  // Null means "untouched" — the field then shows the server's suggested next
  // ID. Deriving it this way avoids a setState-in-effect prefill.
  const [stfIdInput, setStfIdInput] = useState<string | null>(null);
  const stfId = stfIdInput ?? meta.data?.nextStfId ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [dateEngaged, setDateEngaged] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post<CreateResult>("/api/admin/staff", {
        stfId,
        name,
        email,
        photoUrl,
        roles,
        venues,
        dateEngaged,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      pushToast("Staff member onboarded.");
    },
  });

  const fieldErrors = extractFieldErrors(mutation.error);
  const generalError =
    mutation.error instanceof ApiClientError && !Object.keys(fieldErrors).length
      ? mutation.error.message
      : "";

  // Success — show the one-time credentials instead of the form.
  if (mutation.isSuccess) {
    return (
      <CredentialHandoff
        staff={mutation.data.staff}
        email={email}
        tempPassword={mutation.data.tempPassword}
        onDone={() => router.push(`/admin/staff/${mutation.data.staff.id}`)}
      />
    );
  }

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
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Onboard staff</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Creates the staff record and its login account together.
          </p>
        </div>
      </header>

      <form
        className="mt-6 space-y-6 rounded-2xl bg-paper p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <PhotoUpload value={photoUrl} name={name} onChange={setPhotoUrl} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            placeholder="John Doe"
            required
          />
          <Input
            id="stfId"
            label="Staff ID"
            value={stfId}
            onChange={(e) => setStfIdInput(e.target.value.toUpperCase())}
            error={fieldErrors.stfId}
            placeholder="STF-000248"
            className="font-mono"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="email"
            label="Login Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            placeholder="john.doe@lhp.com"
            required
          />
          <Input
            id="dateEngaged"
            label="Date Engaged"
            type="date"
            value={dateEngaged}
            onChange={(e) => setDateEngaged(e.target.value)}
            error={fieldErrors.dateEngaged}
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

        {generalError && (
          <p
            role="alert"
            className="rounded-lg bg-disengaged-soft px-3 py-2 text-sm font-medium text-disengaged-ink"
          >
            {generalError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-paper-sunken pt-5">
          <Link href="/admin">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={mutation.isPending}>
            Create staff member
          </Button>
        </div>
      </form>
    </div>
  );
}

function extractFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiClientError) || !Array.isArray(error.details)) return {};

  const result: Record<string, string> = {};
  for (const issue of error.details as Array<{ path?: string; message?: string }>) {
    if (issue.path && issue.message && !result[issue.path]) {
      result[issue.path] = issue.message;
    }
  }
  return result;
}
