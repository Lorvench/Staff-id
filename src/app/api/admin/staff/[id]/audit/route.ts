import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getAuditLog } from "@/lib/staff-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/staff/[id]/audit — Admin
 *
 * Append-only change history for one staff record, newest first (max 100).
 *
 * Response: { success: true, data: { entries: [{ id, field, oldValue,
 *            newValue, actorEmail, timestamp }] } }
 * Errors:   401 UNAUTHENTICATED, 403 FORBIDDEN
 */
export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;

    const entries = await getAuditLog(id);

    return ok({
      entries: entries.map((e) => ({
        id: e.id,
        field: e.field,
        oldValue: e.oldValue,
        newValue: e.newValue,
        actorEmail: e.actor?.email ?? "system",
        timestamp: e.timestamp.toISOString(),
      })),
    });
  });
}
