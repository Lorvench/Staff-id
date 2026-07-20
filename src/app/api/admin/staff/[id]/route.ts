import { ApiError, handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStaffById, resolveNamesToIds, writeAudit } from "@/lib/staff-service";
import { updateStaffSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/staff/[id] — Admin
 *
 * Response: { success: true, data: StaffDetail }
 * Errors:   404 NOT_FOUND, 401, 403
 */
export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { id } = await params;

    const staff = await getStaffById(id);
    if (!staff) throw new ApiError("NOT_FOUND", "Staff member not found.");

    return ok(staff);
  });
}

/**
 * PATCH /api/admin/staff/[id] — Admin
 *
 * Edits mutable staff fields. STF-ID is deliberately NOT editable: the QR code
 * and every printed badge derive from it, so it is immutable after creation.
 * Status is not editable here either — it has its own audited endpoint.
 *
 * Request:  { name?, photoUrl?, roles?, venues?, dateEngaged? }
 * Response: { success: true, data: StaffDetail }
 * Errors:   404 NOT_FOUND, 422 VALIDATION_ERROR, 401, 403
 *
 * Every changed field writes its own AuditLog row (old -> new).
 */
export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = updateStaffSchema.parse(await request.json());

    const before = await getStaffById(id);
    if (!before) throw new ApiError("NOT_FOUND", "Staff member not found.");

    const [roleIds, venueIds] = await Promise.all([
      body.roles ? resolveNamesToIds("role", body.roles) : Promise.resolve(null),
      body.venues ? resolveNamesToIds("venue", body.venues) : Promise.resolve(null),
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.staff.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl || null } : {}),
          ...(body.dateEngaged !== undefined
            ? { dateEngaged: new Date(body.dateEngaged) }
            : {}),
        },
      });

      if (roleIds) {
        await tx.staffRole.deleteMany({ where: { staffId: id } });
        await tx.staffRole.createMany({
          data: roleIds.map((roleId) => ({ staffId: id, roleId })),
        });
      }

      if (venueIds) {
        await tx.staffVenue.deleteMany({ where: { staffId: id } });
        await tx.staffVenue.createMany({
          data: venueIds.map((venueId) => ({ staffId: id, venueId })),
        });
      }

      // Audit each field that actually changed.
      const changes: Array<[string, string, string]> = [];

      if (body.name !== undefined && body.name !== before.name) {
        changes.push(["name", before.name, body.name]);
      }
      if (body.photoUrl !== undefined && (body.photoUrl || null) !== before.photoUrl) {
        changes.push(["photoUrl", before.photoUrl ? "set" : "none", body.photoUrl ? "set" : "none"]);
      }
      if (body.dateEngaged !== undefined) {
        const next = new Date(body.dateEngaged).toISOString();
        if (next !== before.dateEngaged) {
          changes.push(["dateEngaged", before.dateEngaged, next]);
        }
      }
      if (body.roles !== undefined) {
        const next = [...body.roles].sort().join(", ");
        const prev = [...before.roles].sort().join(", ");
        if (next !== prev) changes.push(["roles", prev, next]);
      }
      if (body.venues !== undefined) {
        const next = [...body.venues].sort().join(", ");
        const prev = [...before.venues].sort().join(", ");
        if (next !== prev) changes.push(["venues", prev, next]);
      }

      for (const [field, oldValue, newValue] of changes) {
        await writeAudit({ staffId: id, field, oldValue, newValue, changedBy: admin.id, tx });
      }
    });

    return ok(await getStaffById(id));
  });
}
