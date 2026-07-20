/** Shared display formatting. Kept in one place so dates read identically everywhere. */

export function formatLongDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Value for a date input (yyyy-mm-dd). */
export function toDateInputValue(iso: string | Date): string {
  return new Date(iso).toISOString().slice(0, 10);
}
