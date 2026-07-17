"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffProfile } from "@/lib/types";
import { isAuthenticated } from "@/lib/auth";
import AppBar from "@/components/AppBar";
import StaffCard from "@/components/StaffCard";
import StaffCardSkeleton from "@/components/StaffCardSkeleton";

type LoadState =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "empty" }
  | { phase: "ready"; staff: StaffProfile };

export default function StaffIdPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  const load = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/staff", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = (await res.json()) as StaffProfile | null;
      if (!data || !data.staffId) {
        setState({ phase: "empty" });
        return;
      }
      setState({ phase: "ready", staff: data });
    } catch {
      setState({ phase: "error" });
    }
  }, []);

  // Route guard — redirect to login if there's no session.
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
    load();
  }, [router, load]);

  if (!authChecked) {
    return <main className="page-backdrop min-h-screen" />;
  }

  return (
    <div className="page-backdrop flex min-h-screen flex-col">
      <AppBar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        {state.phase === "loading" && <StaffCardSkeleton />}

        {state.phase === "ready" && <StaffCard staff={state.staff} />}

        {state.phase === "empty" && (
          <div className="w-full max-w-sm rounded-3xl bg-paper p-10 text-center shadow-card">
            <h1 className="text-lg font-semibold text-ink">No staff profile</h1>
            <p className="mt-2 text-sm text-ink-muted">
              We couldn&apos;t find a staff record for your account. Contact your
              administrator if this seems wrong.
            </p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="w-full max-w-sm rounded-3xl bg-paper p-10 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-disengaged-soft text-disengaged">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 8v5M12 16.5h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <h1 className="mt-4 text-lg font-semibold text-ink">
              Couldn&apos;t load your ID
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Something went wrong fetching your staff profile.
            </p>
            <button
              type="button"
              onClick={load}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-brand/90"
            >
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
