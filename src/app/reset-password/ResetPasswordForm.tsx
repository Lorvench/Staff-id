"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useUiStore } from "@/store/ui-store";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export default function ResetPasswordForm({
  role,
  currentPasswordLabel,
}: {
  role: "ADMIN" | "STAFF";
  currentPasswordLabel: string;
}) {
  const router = useRouter();
  const pushToast = useUiStore((s) => s.pushToast);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post("/api/auth/reset-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    onSuccess: () => {
      pushToast("Password updated.");
      router.replace(role === "ADMIN" ? "/admin" : "/staff");
      router.refresh();
    },
  });

  // Field-level errors come back as a details array from the Zod layer.
  const fieldErrors = extractFieldErrors(mutation.error);
  const generalError =
    mutation.error instanceof ApiClientError && !Object.keys(fieldErrors).length
      ? mutation.error.message
      : "";

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Input
        id="currentPassword"
        label={currentPasswordLabel}
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />

      <Input
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={fieldErrors.newPassword}
        required
      />

      <Input
        id="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={fieldErrors.confirmPassword}
        required
      />

      <p className="text-xs text-ink-faint">Minimum 8 characters.</p>

      {generalError && (
        <p
          role="alert"
          className="rounded-lg bg-disengaged-soft px-3 py-2 text-sm font-medium text-disengaged-ink"
        >
          {generalError}
        </p>
      )}

      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Update password
      </Button>
    </form>
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
