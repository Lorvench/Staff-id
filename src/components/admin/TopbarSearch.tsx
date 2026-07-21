"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui-store";

/**
 * The platform never changes, so this "store" never notifies. The server
 * snapshot is `false`, which keeps the rendered hint identical on both sides of
 * hydration; React swaps in the real value on the client.
 */
const noopSubscribe = () => () => {};
const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const getIsMacServer = () => false;

/**
 * Directory search, bound to the same `filters.q` the staff list reads — so the
 * topbar and the list's own filter grid are one control, not two copies.
 *
 * Visible from `lg` up; below that the filter grid on the list page carries the
 * search input instead (the topbar has no room for it beside the drawer toggle).
 */
export default function TopbarSearch({ onList }: { onList: boolean }) {
  const router = useRouter();
  const q = useUiStore((s) => s.filters.q);
  const setFilter = useUiStore((s) => s.setFilter);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = useSyncExternalStore(noopSubscribe, getIsMac, getIsMacServer);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="hidden items-center gap-2 rounded-full border border-paper-sunken bg-paper-soft px-3 py-1.5 focus-within:border-brand/40 focus-within:bg-paper lg:flex">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="shrink-0 text-ink-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        value={q}
        // Searching is a property of the directory, so a query typed from a
        // detail page sends you back to the list to see the results.
        onChange={(e) => {
          setFilter("q", e.target.value);
          if (!onList) router.push("/admin");
        }}
        placeholder="Search staff, STF-ID, email…"
        aria-label="Search staff directory"
        className="w-44 bg-transparent text-[13px] text-ink placeholder:text-ink-muted focus:outline-none xl:w-60"
      />
      {q ? (
        <button
          type="button"
          onClick={() => {
            setFilter("q", "");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="shrink-0 rounded px-1 text-[13px] leading-none text-ink-muted transition-colors hover:text-ink"
        >
          ✕
        </button>
      ) : (
        <kbd className="shrink-0 rounded border border-paper-sunken bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      )}
    </div>
  );
}
