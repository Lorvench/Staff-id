/**
 * Monogram for a staff member with no uploaded photo.
 *
 * First + last name only, so middle names are skipped: "John Michael Smith"
 * is JS, not JM. A single-word name yields one letter ("David" -> D).
 *
 * Shared by the on-screen avatar and the printed ID card so the two can never
 * disagree about what a person's monogram is.
 */
export function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}
