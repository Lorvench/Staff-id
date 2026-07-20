"use client";

import { useState } from "react";
import { FieldLabel } from "@/components/ui/Field";

/**
 * Multi-select for roles / venues.
 *
 * Existing options are one-tap chips; typing a new value adds it inline. The
 * API resolves names via upsert, so an admin can introduce a new venue without
 * a separate taxonomy-management screen.
 */
export default function TagPicker({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function toggle(name: string) {
    onChange(
      value.includes(name) ? value.filter((v) => v !== name) : [...value, name],
    );
  }

  function addDraft() {
    const name = draft.trim();
    if (!name) return;
    if (!value.includes(name)) onChange([...value, name]);
    setDraft("");
  }

  const unselected = options.filter((o) => !value.includes(o));

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      {/* Selected */}
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {value.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => toggle(name)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-brand/90"
              >
                {name}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="sr-only">Remove {name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder={placeholder}
          aria-label={`Add ${label.toLowerCase()}`}
          className="w-full rounded-xl border border-paper-sunken bg-paper-soft px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-paper focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={addDraft}
          className="shrink-0 rounded-xl border border-paper-sunken px-3 text-sm font-semibold text-ink-soft transition hover:bg-paper-sunken"
        >
          Add
        </button>
      </div>

      {/* Suggestions */}
      {unselected.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {unselected.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => toggle(name)}
                className="rounded-lg bg-paper-sunken px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:bg-brand-soft hover:text-brand"
              >
                + {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
