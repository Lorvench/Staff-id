import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteTaxonomy, renameTaxonomy } from "@/lib/taxonomy-service";
import { taxonomyKindSchema, taxonomyNameSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string; id: string }> };

/**
 * PATCH /api/admin/taxonomy/[kind]/[id] — Admin
 *
 * Renames in place, so every staff member holding it follows automatically —
 * the join tables reference the id, not the name.
 *
 * Request:  { name }
 * Response: { success: true, data: { id, name, staffCount } }
 * Errors:   404 NOT_FOUND, 409 CONFLICT (name taken), 422, 401, 403
 */
export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { kind: rawKind, id } = await params;
    const kind = taxonomyKindSchema.parse(rawKind);
    const { name } = taxonomyNameSchema.parse(await request.json());

    return ok(await renameTaxonomy(kind, id, name));
  });
}

/**
 * DELETE /api/admin/taxonomy/[kind]/[id] — Admin
 *
 * Refused while anything is still assigned — see `deleteTaxonomy` for why a
 * cascade would be the wrong behaviour here.
 *
 * Response: { success: true, data: { deleted: true } }
 * Errors:   404 NOT_FOUND, 409 CONFLICT (still in use), 422, 401, 403
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const { kind: rawKind, id } = await params;
    const kind = taxonomyKindSchema.parse(rawKind);

    await deleteTaxonomy(kind, id);
    return ok({ deleted: true });
  });
}
