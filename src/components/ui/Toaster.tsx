"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/ui-store";

/** Transient feedback for mutations. Auto-dismisses; stacks bottom-right. */
export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={`animate-fade-scale-in pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-card-lg ${
        tone === "error"
          ? "bg-disengaged text-white"
          : "bg-ink text-white"
      }`}
    >
      {message}
    </div>
  );
}
