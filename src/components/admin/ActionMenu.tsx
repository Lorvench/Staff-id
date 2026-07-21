"use client";

import { useEffect, useRef, useState } from "react";

export type RowAction = {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
};

/**
 * Per-row "⋯" actions.
 *
 * The panel is `fixed` and positioned from the trigger's bounding box rather
 * than absolutely positioned inside the row — a table row sits inside an
 * `overflow-x-auto` wrapper, which would otherwise clip the menu. The trade-off
 * is that the menu can't follow the page, so scroll and resize close it.
 */
export default function ActionMenu({
  actions,
  label = "Actions",
}: {
  actions: RowAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
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

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-lg text-[18px] leading-none text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        ⋯
      </button>

      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-52 overflow-hidden rounded-xl border border-paper-sunken bg-paper py-1 shadow-card-lg"
          >
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-paper-sunken ${
                  a.danger ? "text-disengaged" : "text-ink-soft"
                }`}
              >
                {a.icon && <span className="grid w-4 shrink-0 place-items-center">{a.icon}</span>}
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
