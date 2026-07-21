"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Right-hand slide-over panel.
 *
 * Always mounted so the panel can transition in and out; `open` drives the
 * transform. Children are only rendered while open, which keeps the form inside
 * unmounted (and therefore reset) between visits.
 */
export default function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  width = "max-w-xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Pinned action bar. Stays visible while the body scrolls, so the primary
   * action never scrolls out of reach on a long form. Submit buttons in here sit
   * outside the `<form>`, so they need `form="<the form's id>"`.
   */
  footer?: React.ReactNode;
  /** Tailwind max-width class for the panel. */
  width?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Remember what was focused before opening, and give focus to the panel.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();

    return () => restoreFocusRef.current?.focus();
  }, [open]);

  // Escape closes; Tab is trapped inside the panel while it's open.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll so the page behind doesn't move under the panel.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-hidden={!open}
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 z-[70] flex w-full ${width} transform flex-col bg-paper shadow-card-lg outline-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-paper-sunken px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="drawer-title" className="font-serif text-lg font-bold text-ink">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{open && children}</div>

        {open && footer && (
          <div className="shrink-0 border-t border-paper-sunken bg-paper px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
