import { z } from "zod";

/**
 * ---------------------------------------------------------------------------
 * Zod schemas — the single source of request validation for every API route.
 * Route handlers parse with these; no handler validates input ad hoc.
 * ---------------------------------------------------------------------------
 */

/** "STF-000247" — six digits, zero-padded. Immutable after creation. */
export const STF_ID_PATTERN = /^STF-\d{6}$/;

const stfId = z
  .string()
  .trim()
  .regex(STF_ID_PATTERN, "Staff ID must look like STF-000247");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters");

const nameList = z
  .array(z.string().trim().min(1))
  .max(20)
  .default([]);

// --- Auth -------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });

// --- Admin: staff -----------------------------------------------------------

export const createStaffSchema = z.object({
  stfId,
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.email("A valid email is required").trim().toLowerCase(),
  /** Data URI or absolute/relative URL. Optional — falls back to initials. */
  photoUrl: z.string().trim().max(2_000_000).optional().or(z.literal("")),
  roles: nameList,
  venues: nameList,
  dateEngaged: z.iso.date("Date engaged is required"),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  photoUrl: z.string().trim().max(2_000_000).optional().or(z.literal("")),
  roles: nameList.optional(),
  venues: nameList.optional(),
  dateEngaged: z.iso.date().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISENGAGED"]),
});

export const staffQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "DISENGAGED"]).optional(),
  role: z.string().trim().optional(),
  venue: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type StaffQuery = z.infer<typeof staffQuerySchema>;
