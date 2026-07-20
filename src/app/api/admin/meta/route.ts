import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listRoles, listVenues, suggestNextStfId } from "@/lib/staff-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/meta — Admin
 *
 * Form metadata for the create/edit staff screens.
 *
 * Response: { success: true, data: { roles: string[], venues: string[], nextStfId } }
 * Errors:   401 UNAUTHENTICATED, 403 FORBIDDEN
 *
 * `nextStfId` is a convenience suggestion only. The unique constraint on
 * Staff.stfId is what actually prevents duplicates under a concurrent race —
 * two admins creating at once get a 409 CONFLICT, not a silent collision.
 */
export async function GET() {
  return handle(async () => {
    await requireAdmin();

    const [roles, venues, nextStfId] = await Promise.all([
      listRoles(),
      listVenues(),
      suggestNextStfId(),
    ]);

    return ok({
      roles: roles.map((r) => r.name),
      venues: venues.map((v) => v.name),
      nextStfId,
    });
  });
}
