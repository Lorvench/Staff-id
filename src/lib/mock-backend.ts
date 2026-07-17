import type {
  PublicStaffInfo,
  StaffProfile,
  VerificationResult,
} from "@/lib/types";

/**
 * ---------------------------------------------------------------------------
 * MOCK BACKEND
 * ---------------------------------------------------------------------------
 * This file stands in for the real backend so the frontend can be run and
 * demoed end-to-end. In production these values come from real API endpoints;
 * the frontend never generates tokens, stores staff records, or determines
 * ACTIVE / DISENGAGED status itself.
 *
 * Swap the functions below for real `fetch` calls to your backend and delete
 * this file — nothing else in the UI needs to change.
 * ---------------------------------------------------------------------------
 */

/** Base URL used to build the QR verification link. */
function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

interface StaffRecord {
  token: string;
  staffId: string;
  fullName: string;
  photoUrl: string;
  roles: string[];
  venues: string[];
  status: "ACTIVE" | "DISENGAGED";
  dateEngaged: string;
}

const STAFF: StaffRecord[] = [
  {
    token: "abc123xyz",
    staffId: "STF-000247",
    fullName: "John Doe",
    photoUrl: "/staff/john-doe.svg",
    roles: ["Guest Relations Officer"],
    venues: ["The Lion's Den, Lagos", "LHP Suites, Abuja"],
    status: "ACTIVE",
    dateEngaged: "2025-01-12",
  },
  {
    token: "def456uvw",
    staffId: "STF-000512",
    fullName: "Amaka Obi",
    photoUrl: "/staff/amaka-obi.svg",
    roles: ["Floor Supervisor", "Events Host"],
    venues: ["Savannah Grill, Port Harcourt"],
    status: "DISENGAGED",
    dateEngaged: "2023-06-03",
  },
];

/** The staff member considered "logged in" on the authenticated page. */
const CURRENT_STAFF_TOKEN = "abc123xyz";

function toPublic(record: StaffRecord): PublicStaffInfo {
  return {
    staffId: record.staffId,
    fullName: record.fullName,
    photoUrl: record.photoUrl,
    roles: record.roles,
    venues: record.venues,
    status: record.status,
  };
}

/** Backend: fetch the authenticated staff member's full profile + QR URL. */
export function getCurrentStaffProfile(): StaffProfile {
  const record = STAFF.find((s) => s.token === CURRENT_STAFF_TOKEN)!;
  return {
    staffId: record.staffId,
    fullName: record.fullName,
    photoUrl: record.photoUrl,
    roles: record.roles,
    venues: record.venues,
    status: record.status,
    dateEngaged: record.dateEngaged,
    verificationUrl: `${siteUrl()}/verify/${record.token}`,
  };
}

/** Backend: resolve a verification token to a live status result. */
export function verifyToken(token: string): VerificationResult {
  const record = STAFF.find((s) => s.token === token);
  if (!record) {
    return { outcome: "NOT_FOUND" };
  }
  return {
    outcome: record.status === "ACTIVE" ? "VERIFIED" : "DISENGAGED",
    staff: toPublic(record),
    verifiedAt: new Date().toISOString(),
  };
}
