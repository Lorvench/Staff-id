import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createTaxonomy, listTaxonomy } from "@/lib/taxonomy-service";
import { taxonomyKindSchema, taxonomyNameSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string }> };

/**
 * GET /api/admin/taxonomy/[kind] — Admin
 *
 * `kind` is "roles" or "venues"; anything else fails the enum and returns 422
 * rather than reaching the database.
 *
 * Response: { success: true, data: { items: [{ id, name, staffCount }] } }
 * Errors:   401 UNAUTHENTICATED, 403 FORBIDDEN, 422 VALIDATION_ERROR
 */
export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const kind = taxonomyKindSchema.parse((await params).kind);

    return ok({ items: await listTaxonomy(kind) });
  });
}

/**
 * POST /api/admin/taxonomy/[kind] — Admin
 *
 * Request:  { name }
 * Response: { success: true, data: { id, name, staffCount } }   (201)
 * Errors:   409 CONFLICT (name already exists — the unique index is what
 *           actually enforces this under a concurrent race), 422, 401, 403
 */
export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    const kind = taxonomyKindSchema.parse((await params).kind);
    const { name } = taxonomyNameSchema.parse(await request.json());

    return ok(await createTaxonomy(kind, name), 201);
  });
}
