"use client";

import { useEffect, useRef, useState } from "react";

const ic = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** The single filter mark — used by every filter control. */
export const FilterIcon = () => (
  <svg {...ic}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="10" y1="18" x2="14" y2="18" />
  </svg>
);

export type FilterOption = {
  value: string;
  label: string;
  /** Optional status dot colour class, e.g. `bg-active`. */
  dot?: string;
};

/**
 * Filter pill + dropdown. `""` is the "all" value, matching how the staff
 * filters are stored in `ui-store`. Positioned `fixed` from the trigger box for
 * the same clipping reason as `ActionMenu`.
 */
export default function FilterDropdown({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const active = value !== "";

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Keep the 224px panel inside the viewport when the pill sits near the edge.
      setPos({
        top: r.bottom + 6,
        left: Math.min(r.left, Math.max(8, window.innerWidth - 232)),
      });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[13px] font-medium transition-colors ${
          active
            ? "border-brand/40 bg-brand-soft text-brand"
            : "border-paper-sunken text-ink-soft hover:bg-paper-sunken"
        }`}
      >
        <FilterIcon />
        {active && selected ? selected.label : title}
      </button>

      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="fixed z-50 max-h-[60vh] w-56 overflow-y-auto rounded-xl border border-paper-sunken bg-paper py-1 shadow-card-lg"
          >
            <p className="field-label px-3.5 pb-1 pt-1.5">Filter by {title.toLowerCase()}</p>
            {options.map((o) => {
              const isActive = o.value === value;
              return (
                <button
                  key={o.value || "all"}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? "bg-paper-sunken font-semibold text-ink"
                      : "text-ink-soft hover:bg-paper-sunken"
                  }`}
                >
                  {o.dot && <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${o.dot}`} />}
                  <span className="flex-1 truncate">{o.label}</span>
                  {isActive && <span className="text-[12px] text-brand">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
