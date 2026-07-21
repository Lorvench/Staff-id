"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldLabel, FieldError } from "@/components/ui/Field";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Parses `YYYY-MM-DD` as a *local* date — `new Date(s)` would read it as UTC. */
function parseISO(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function pretty(s: string): string {
  const d = parseISO(s);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/**
 * Calendar date picker over an ISO `YYYY-MM-DD` string.
 *
 * Controlled via value/onChange so it drops straight into a react-hook-form
 * `Controller`. `min`/`max` bound the selectable range and also stop the
 * calendar navigating past those months; both are optional — unlike the booking
 * picker this is modelled on, an engagement date is usually in the past.
 */
export default function DateField({
  value,
  onChange,
  onBlur,
  label,
  id,
  error,
  min,
  max,
  placeholder = "Select date",
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  id?: string;
  error?: string;
  /** Inclusive ISO bounds, e.g. `2024-01-01`. */
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const selected = parseISO(value);
  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;

  const openPicker = () => {
    const base = selected ?? minDate ?? maxDate ?? new Date();
    setView(monthStart(base));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      // Stop here so a drawer or dialog behind the picker doesn't also close.
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onBlur]);

  const cells = useMemo(() => {
    if (!view) return [];
    const first = monthStart(view);
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(view.getFullYear(), view.getMonth(), d));
    }
    return out;
  }, [view]);

  const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const canPrev = !!view && (!minDate || monthIndex(view) > monthIndex(minDate));
  const canNext = !!view && (!maxDate || monthIndex(view) < monthIndex(maxDate));

  const isDisabled = (d: Date) => {
    if (minDate && dayStart(d) < dayStart(minDate)) return true;
    if (maxDate && dayStart(d) > dayStart(maxDate)) return true;
    return false;
  };

  return (
    <div>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}

      <div ref={ref} className={`relative ${label ? "mt-2" : ""}`}>
        <button
          id={id}
          type="button"
          onClick={() => (open ? close() : openPicker())}
          aria-haspopup="dialog"
          aria-expanded={open}
          // `aria-invalid`/`aria-required` aren't valid on role=button, so the
          // error is associated by id instead.
          aria-describedby={error && id ? `${id}-error` : undefined}
          className={`flex w-full items-center justify-between rounded-xl border bg-paper-soft px-4 py-3 text-left text-[15px] outline-none transition focus:bg-paper focus:ring-2 ${
            error
              ? "border-disengaged focus:border-disengaged focus:ring-disengaged/20"
              : "border-paper-sunken focus:border-brand focus:ring-brand/20"
          } ${value ? "text-ink" : "text-ink-faint"}`}
        >
          <span>{value ? pretty(value) : placeholder}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
            className="shrink-0 text-ink-muted"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18M8 2v4M16 2v4" />
          </svg>
        </button>

        {open && view && (
          <div
            role="dialog"
            aria-label="Choose a date"
            className="animate-fade-scale-in absolute left-0 z-30 mt-2 w-[17rem] max-w-[calc(100vw-2.5rem)] rounded-xl border border-paper-sunken bg-paper p-3 shadow-card-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <CalNav
                label="Previous month"
                glyph="‹"
                disabled={!canPrev}
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              />
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>
              <CalNav
                label="Next month"
                glyph="›"
                disabled={!canNext}
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              />
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DOW.map((d) => (
                <div
                  key={d}
                  className="flex h-8 items-center justify-center text-[10px] font-semibold uppercase text-ink-muted"
                >
                  {d}
                </div>
              ))}
              {cells.map((d, i) =>
                d ? (
                  <button
                    key={i}
                    type="button"
                    disabled={isDisabled(d)}
                    aria-current={selected && toISO(d) === toISO(selected) ? "date" : undefined}
                    onClick={() => {
                      onChange(toISO(d));
                      close();
                    }}
                    className={`flex h-8 items-center justify-center rounded-lg text-[13px] transition-colors ${
                      selected && toISO(d) === toISO(selected)
                        ? "bg-brand font-semibold text-white"
                        : isDisabled(d)
                          ? "cursor-not-allowed text-ink-faint"
                          : "text-ink hover:bg-paper-sunken"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                ) : (
                  <div key={i} className="h-8" />
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(toISO(new Date()));
                close();
              }}
              disabled={isDisabled(new Date())}
              className="mt-2 w-full rounded-lg py-1.5 text-[12px] font-semibold text-brand transition-colors hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Today
            </button>
          </div>
        )}
      </div>

      <span id={error && id ? `${id}-error` : undefined}>
        <FieldError>{error}</FieldError>
      </span>
    </div>
  );
}

function CalNav({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg text-[16px] text-ink-soft transition-colors enabled:hover:bg-paper-sunken disabled:cursor-not-allowed disabled:opacity-25"
    >
      {glyph}
    </button>
  );
}
