import { handle, ok } from "@/lib/api";
import { getPublicStaffByStfId, type PublicStaff } from "@/lib/staff-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ stfId: string }> };

/**
 * GET /api/verify/[stfId] — PUBLIC, no authentication
 *
 * Response (found):     { success: true, data: { found: true,  staff: PublicStaff, verifiedAt } }
 * Response (not found): { success: true, data: { found: false, verifiedAt } }   (200, not 404)
 *
 * Returns ONLY public-safe fields — name, photo, STF-ID, status. Roles and
 * venues are deliberately excluded: telling an anonymous scanner where someone
 * works is a personal-safety issue, not just a privacy one.
 *
 * `found: false` is returned as a 200 rather than a 404 so that a missing
 * record and a real record are indistinguishable in HTTP status alone, and so
 * the page can render a designed state instead of an error.
 *
 * Never cached — status must always be read live at request time.
 */
type VerifyPayload =
  | { found: true; staff: PublicStaff; verifiedAt: string }
  | { found: false; verifiedAt: string };

export async function GET(_request: Request, { params }: Ctx) {
  return handle<VerifyPayload>(async () => {
    const { stfId } = await params;
    const staff = await getPublicStaffByStfId(decodeURIComponent(stfId).toUpperCase());
    const verifiedAt = new Date().toISOString();

    const payload: VerifyPayload = staff
      ? { found: true, staff, verifiedAt }
      : { found: false, verifiedAt };

    return ok(payload);
  });
}
