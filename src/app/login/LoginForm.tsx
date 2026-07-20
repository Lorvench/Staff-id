"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type LoginResult = {
  role: "ADMIN" | "STAFF";
  mustResetPw: boolean;
};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.post<LoginResult>("/api/auth/login", credentials),
    onSuccess: (user) => {
      // Server components read the new cookie — refresh so guards re-evaluate.
      if (user.mustResetPw) {
        router.replace("/reset-password");
      } else {
        router.replace(user.role === "ADMIN" ? "/admin" : "/staff");
      }
      router.refresh();
    },
  });

  const errorMessage =
    mutation.error instanceof ApiClientError
      ? mutation.error.message
      : mutation.error
        ? "Unable to sign in. Please try again."
        : "";

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ email, password });
      }}
    >
      <Input
        id="email"
        label="Username / Email"
        type="text"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@lhp.com"
        required
      />

      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg bg-disengaged-soft px-3 py-2 text-sm font-medium text-disengaged-ink"
        >
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" loading={mutation.isPending}>
        {mutation.isPending ? "Signing in…" : "Login"}
      </Button>
    </form>
  );
}
