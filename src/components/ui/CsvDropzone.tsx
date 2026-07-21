"use client";

import { useRef, useState } from "react";

/**
 * CSV-only file drop zone.
 *
 * Accepts a file by drop or click, rejects anything that isn't a `.csv` before
 * handing it up, and clears its own input afterwards so re-picking the same file
 * still fires a change event.
 */
export default function CsvDropzone({
  fileName,
  invalid,
  onFile,
  onReject,
}: {
  /** Name of the currently selected file, shown in place of the prompt. */
  fileName?: string;
  invalid?: boolean;
  onFile: (file: File) => void;
  /** Called instead of `onFile` when the dropped file isn't a CSV. */
  onReject: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      onReject("That isn't a CSV file.");
    } else {
      onFile(file);
    }
    // Allow the same file to be chosen twice in a row.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-9 text-center transition-colors ${
        dragging
          ? "border-brand bg-brand-soft"
          : invalid
            ? "border-disengaged bg-disengaged-soft/40"
            : "border-paper-sunken bg-paper-soft hover:border-brand"
      }`}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-brand"
      >
        <path d="M12 16V4m0 0L8 8m4-4l4 4" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      <span className="text-sm font-semibold text-ink">
        {fileName || "Drop a CSV here, or click to choose"}
      </span>
      <span className="text-xs text-ink-muted">.csv files only</span>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </label>
  );
}
