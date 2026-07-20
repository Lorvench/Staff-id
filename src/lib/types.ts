import type { StaffStatus } from "@/generated/prisma/client";

/**
 * Shared display types. The database enum is the single source of truth for
 * status — this alias just keeps the UI vocabulary readable.
 */
export type EmploymentStatus = StaffStatus;

export type { StaffDetail, PublicStaff } from "@/lib/staff-service";

export type AuditEntry = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  actorEmail: string;
  timestamp: string;
};
