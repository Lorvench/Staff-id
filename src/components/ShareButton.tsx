"use client";

import { useState } from "react";

interface ShareButtonProps {
  /** The verification URL to share. */
  url: string;
  title?: string;
}

type Feedback = "idle" | "copied" | "shared";

/**
 * Shares the verification URL via the Web Share API where supported,
 * falling back to copy-to-clipboard.
 */
export default function ShareButton({
  url,
  title = "Digital Staff ID",
}: ShareButtonProps) {
  const [feedback, setFeedback] = useState<Feedback>("idle");

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: "Verify staff identity", url });
        setFeedback("shared");
      } catch {
        // User dismissed the share sheet — no action needed.
        return;
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setFeedback("copied");
      } catch {
        return;
      }
    }
    window.setTimeout(() => setFeedback("idle"), 2200);
  }

  const label =
    feedback === "copied"
      ? "Link copied"
      : feedback === "shared"
        ? "Shared"
        : "Share";

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {feedback === "idle" ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8.7 13.3l6.6 3.8M15.3 6.9l-6.6 3.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </button>
  );
}
