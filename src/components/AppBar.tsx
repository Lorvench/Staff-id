"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

/** Top app bar for authenticated screens: brand + logout. */
export default function AppBar() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-paper-sunken/70 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Image
          src="/logo.svg"
          alt="LHP — Lion Hospitality Partners"
          width={64}
          height={34}
          priority
        />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-paper-sunken active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5M14 5h4a2 2 0 012 2v10a2 2 0 01-2 2h-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}
