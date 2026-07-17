export type EmploymentStatus = "ACTIVE" | "DISENGAGED";

/** Full staff record returned to the authenticated Digital Staff ID page. */
export interface StaffProfile {
  staffId: string; // e.g. "STF-000247"
  fullName: string;
  photoUrl: string;
  roles: string[];
  venues: string[];
  status: EmploymentStatus;
  dateEngaged: string; // ISO date string
  verificationUrl: string; // the URL encoded into the QR code (built by the backend)
}

/** Public verification result returned by the /verify endpoint. */
export type VerificationResult =
  | {
      outcome: "VERIFIED";
      staff: PublicStaffInfo;
      verifiedAt: string; // ISO timestamp
    }
  | {
      outcome: "DISENGAGED";
      staff: PublicStaffInfo;
      verifiedAt: string;
    }
  | {
      outcome: "NOT_FOUND"; // malformed / expired / unknown token
    };

/** The reduced staff info that is safe to show on the public verification page. */
export interface PublicStaffInfo {
  staffId: string;
  fullName: string;
  photoUrl: string;
  roles: string[];
  venues: string[];
  status: EmploymentStatus;
}
