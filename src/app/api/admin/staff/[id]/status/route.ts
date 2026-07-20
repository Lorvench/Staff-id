import { ApiError, handle, ok } from "@/lib/api";
import { requireAdmin, revokeAllSessionsForStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStaffById, writeAudit } from "@/lib/staff-service";
import { updateStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/staff/[id]/status — Admin
 *
 * The single control for a staff member's lifecycle. Staff records are never
 * hard-deleted (locked decision); status is the only lifecycle lever.
 *
 * Request:  { status: "ACTIVE" | "DISENGAGED" }
 * Response: { success: true, data: { staff, changed, sessionsRevoked } }
 * Errors:   404 NOT_FOUND, 422 VALIDATION_ERROR, 401, 403
 *
 * Guarantees:
 *  - IDEMPOTENT       toggling to the current status is a no-op: no audit row,
 *                     no session revocation, still 200. Safe under double-click
 *                     and concurrent admin races.
 *  - AUDITED          a real change writes an AuditLog row (old -> new, actor).
 *  - SESSION-REVOKING DISENGAGED kills every active session for that staff
 *                     member immediately, so an already-open browser is locked
 *                     out on its very next request.
 *  - RESET-ON-REACTIVATE  DISENGAGED -> ACTIVE sets mustResetPw = true, since
 *                     the old password may have been exposed while disengaged.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const { status } = updateStatusSchema.parse(await request.json());

    const existing = await prisma.staff.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });
    if (!existing) throw new ApiError("NOT_FOUND", "Staff member not found.");

    // Idempotent no-op.
    if (existing.status === status) {
      return ok({
        staff: await getStaffById(id),
        changed: false,
        sessionsRevoked: 0,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.staff.update({ where: { id }, data: { status } });

      // Reactivation forces a password reset (locked decision, always-on).
      if (status === "ACTIVE") {
        await tx.user.update({
          where: { id: existing.userId },
          data: { mustResetPw: true },
        });
      }

      await writeAudit({
        staffId: id,
        field: "status",
        oldValue: existing.status,
        newValue: status,
        changedBy: admin.id,
        tx,
      });
    });

    // Revoke outside the transaction — the status change must stand even if
    // session cleanup hiccups; the live requireStaff() check is the backstop.
    const sessionsRevoked =
      status === "DISENGAGED" ? await revokeAllSessionsForStaff(id) : 0;

    return ok({ staff: await getStaffById(id), changed: true, sessionsRevoked });
  });
}
