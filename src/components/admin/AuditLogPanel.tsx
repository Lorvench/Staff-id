"use client";

import type { AuditEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  name: "Name",
  roles: "Roles",
  venues: "Venues",
  dateEngaged: "Date engaged",
  photoUrl: "Photo",
  record: "Record",
};

/** Append-only change history for a staff record, newest first. */
export default function AuditLogPanel({
  entries,
  loading,
}: {
  entries: AuditEntry[];
  loading: boolean;
}) {
  return (
    <section className="mt-4 rounded-2xl bg-paper p-6 shadow-card">
      <h2 className="font-serif text-base font-bold text-ink">Audit log</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Every change to this record, most recent first.
      </p>

      {loading && (
        <ul className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </ul>
      )}

      {!loading && entries.length === 0 && (
        <p className="mt-5 rounded-xl bg-paper-soft px-4 py-6 text-center text-sm text-ink-muted">
          No changes recorded yet.
        </p>
      )}

      {!loading && entries.length > 0 && (
        <ol className="mt-5 space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-xl bg-paper-soft px-4 py-3 text-sm"
            >
              <span className="font-semibold text-ink">
                {FIELD_LABELS[entry.field] ?? entry.field}
              </span>

              {entry.oldValue && (
                <>
                  <span className="text-ink-faint line-through">{entry.oldValue}</span>
                  <span className="text-ink-faint" aria-hidden="true">
                    →
                  </span>
                </>
              )}
              <span className="font-medium text-ink-soft">{entry.newValue ?? "—"}</span>

              <span className="ml-auto whitespace-nowrap text-xs text-ink-faint">
                {entry.actorEmail} · {formatDateTime(entry.timestamp)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
