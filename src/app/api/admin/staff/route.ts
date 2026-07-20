import { handle, ok } from "@/lib/api";
import { generateTempPassword, hashPassword, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listStaff,
  resolveNamesToIds,
  getStaffById,
  writeAudit,
} from "@/lib/staff-service";
import { createStaffSchema, staffQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/staff — Admin
 *
 * Query:    ?q=&status=ACTIVE|DISENGAGED&role=&venue=&page=1&pageSize=20
 *           `q` matches name, STF-ID, or email (case-insensitive).
 * Response: { success: true, data: { items, total, page, pageSize, pageCount } }
 * Errors:   401 UNAUTHENTICATED, 403 FORBIDDEN
 */
export async function GET(request: Request) {
  return handle(async () => {
    await requireAdmin();

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = staffQuerySchema.parse(params);

    return ok(await listStaff(query));
  });
}

/**
 * POST /api/admin/staff — Admin
 *
 * Creates a Staff record together with its linked User login account. The
 * temporary password is generated server-side, returned exactly once in this
 * response for the admin to hand over, and never stored in plaintext. The new
 * account is flagged `mustResetPw` so the staff member must change it on first
 * login.
 *
 * Request:  { stfId, name, email, photoUrl?, roles[], venues[], dateEngaged }
 * Response: { success: true, data: { staff, tempPassword } }   (201)
 * Errors:   409 CONFLICT (STF-ID or email already in use),
 *           422 VALIDATION_ERROR, 401, 403
 */
export async function POST(request: Request) {
  return handle(async () => {
    const admin = await requireAdmin();
    const body = createStaffSchema.parse(await request.json());

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const [roleIds, venueIds] = await Promise.all([
      resolveNamesToIds("role", body.roles),
      resolveNamesToIds("venue", body.venues),
    ]);

    const staffId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          role: "STAFF",
          mustResetPw: true,
        },
      });

      const staff = await tx.staff.create({
        data: {
          stfId: body.stfId,
          name: body.name,
          photoUrl: body.photoUrl || null,
          dateEngaged: new Date(body.dateEngaged),
          status: "ACTIVE",
          userId: user.id,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
          venues: { create: venueIds.map((venueId) => ({ venueId })) },
        },
      });

      await writeAudit({
        staffId: staff.id,
        field: "record",
        oldValue: null,
        newValue: `created (${staff.stfId})`,
        changedBy: admin.id,
        tx,
      });

      return staff.id;
    });

    return ok({ staff: await getStaffById(staffId), tempPassword }, 201);
  });
}
