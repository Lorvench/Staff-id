"use client";

import { useEffect, useRef } from "react";

/**
 * Centred modal dialog.
 *
 * Sits at z-90 — above both the drawer layer (z-60/70) and `ConfirmDialog`
 * (z-80). Like `ConfirmDialog`, it must be rendered as a sibling of any
 * `Drawer`, never inside one: a drawer panel is transformed, which makes it the
 * containing block for `position: fixed` descendants.
 */
export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => restoreFocusRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="animate-fade-scale-in relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-paper shadow-card-lg outline-none"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-paper-sunken px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-serif text-base font-bold text-ink">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
