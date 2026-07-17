"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DEMO_CREDENTIALS, login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    // Simulate a brief network round-trip.
    window.setTimeout(() => {
      if (login(email, password)) {
        router.push("/staff-id");
      } else {
        setError(true);
        setSubmitting(false);
      }
    }, 450);
  }

  return (
    <main className="page-backdrop flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="animate-fade-scale-in w-full max-w-sm rounded-3xl bg-paper p-8 shadow-card-lg">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt="LHP — Lion Hospitality Partners"
            width={120}
            height={64}
            priority
          />
          <h1 className="mt-6 text-xl font-bold tracking-tight text-ink">
            Staff Sign In
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Access your Digital Staff ID
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="field-label block"
            >
              Username / Email
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@lhp.com"
              className="mt-2 w-full rounded-xl border border-paper-sunken bg-paper-soft px-4 py-3 text-[15px] text-ink outline-none transition focus:border-brand focus:bg-paper focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="field-label block"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-paper-sunken bg-paper-soft px-4 py-3 text-[15px] text-ink outline-none transition focus:border-brand focus:bg-paper focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-disengaged-soft px-3 py-2 text-sm font-medium text-disengaged-ink">
              Incorrect username or password.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-paper-soft px-4 py-3 text-center text-xs text-ink-muted">
          <span className="font-semibold text-ink-soft">Demo login</span> ·{" "}
          {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
        </div>

        <div className="mt-5 border-t border-paper-sunken pt-4 text-center">
          <p className="field-label">Public verification demo</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            <Link href="/verify/abc123xyz" className="font-medium text-brand hover:underline">
              Active
            </Link>
            <Link href="/verify/def456uvw" className="font-medium text-brand hover:underline">
              Disengaged
            </Link>
            <Link href="/verify/unknown-token" className="font-medium text-brand hover:underline">
              Invalid
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
