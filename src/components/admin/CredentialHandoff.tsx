"use client";

import { useState } from "react";
import type { StaffDetail } from "@/lib/staff-service";
import Button from "@/components/ui/Button";
import StaffPhoto from "@/components/StaffPhoto";

/**
 * One-time credential reveal.
 *
 * The temporary password exists in plaintext only in this response — it is
 * stored hashed and can never be shown again. The staff member is forced to
 * change it at first login (`mustResetPw`).
 */
export default function CredentialHandoff({
  staff,
  email,
  tempPassword,
  onDone,
}: {
  staff: StaffDetail;
  email: string;
  tempPassword: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(
        `LHP Digital Staff ID\nEmail: ${email}\nTemporary password: ${tempPassword}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — the values are on screen regardless */
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="animate-fade-scale-in rounded-2xl bg-paper p-8 text-center shadow-card-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-active-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-active"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-lg font-bold tracking-tight text-ink">
          {staff.name} is onboarded
        </h1>
        <p className="mt-1.5 font-mono text-sm text-ink-muted">{staff.stfId}</p>

        <div className="mt-6 flex justify-center">
          <StaffPhoto src={staff.photoUrl} name={staff.name} size={72} />
        </div>

        <div className="mt-6 rounded-xl bg-paper-soft p-4 text-left">
          <p className="field-label">Sign-in email</p>
          <p className="mt-1 break-all font-mono text-sm text-ink">{email}</p>

          <p className="field-label mt-4">Temporary password</p>
          <p className="mt-1 break-all font-mono text-base font-semibold text-ink">
            {tempPassword}
          </p>
        </div>

        <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
          Copy this now — it cannot be shown again. {staff.name.split(" ")[0]} must
          change it at first sign-in.
        </p>

        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={copyAll}>
            {copied ? "Copied" : "Copy credentials"}
          </Button>
          <Button className="flex-1" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
