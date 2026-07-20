import { ApiError, handle, ok } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { getStaffById } from "@/lib/staff-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/staff/me — Staff (own record only)
 *
 * Response: { success: true, data: StaffDetail }
 * Errors:   401 UNAUTHENTICATED, 403 FORBIDDEN (not staff, or DISENGAGED),
 *           404 NOT_FOUND
 *
 * There is no `/api/staff/[id]` for staff by design — the record is resolved
 * from the session, so one staff member can never read another's by guessing
 * an id. `requireStaff()` re-checks live status on every call, so a session
 * that was valid a second ago stops working the instant the member is
 * disengaged.
 */
export async function GET() {
  return handle(async () => {
    const user = await requireStaff();

    const staff = await getStaffById(user.staff.id);
    if (!staff) throw new ApiError("NOT_FOUND", "Staff record not found.");

    return ok(staff);
  });
}
