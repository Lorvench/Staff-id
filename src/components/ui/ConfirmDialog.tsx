"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Modal confirmation step. Required before any destructive or
 * status-changing admin action — a disengage must never be one stray click.
 *
 * Sits at z-80, above the drawer layer (z-60/70), because it is raised *from*
 * a drawer and must cover it. It must also be rendered as a sibling of any
 * `Drawer`, never inside one: the drawer panel is transformed, which would make
 * it the containing block for this dialog's `position: fixed` and trap it.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    confirmRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
    >
      <button
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
      />
      <div className="animate-fade-scale-in relative w-full max-w-sm rounded-2xl bg-paper p-6 shadow-card-lg">
        <h2 className="font-serif text-base font-bold text-ink">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant={tone}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
