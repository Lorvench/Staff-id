import "server-only";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

/**
 * ---------------------------------------------------------------------------
 * Roles & Venues — the two assignable taxonomies.
 * ---------------------------------------------------------------------------
 * Both are the same shape (id + unique name + staff join table), so they share
 * one service and one pair of routes keyed on `kind`. The Role and Venue Prisma
 * delegates form a union TypeScript can't call generically, so each operation
 * branches explicitly — the same approach `resolveNamesToIds` already takes.
 *
 * Deliberately *not* audited: `AuditLog` hangs off a `staffId`, and a taxonomy
 * change belongs to no single staff record. Auditing these would need a schema
 * change.
 * ---------------------------------------------------------------------------
 */

export type TaxonomyKind = "roles" | "venues";

export type TaxonomyItem = {
  id: string;
  name: string;
  /** How many staff currently hold this role/venue. */
  staffCount: number;
};

/** Singular label for user-facing messages. */
export function labelFor(kind: TaxonomyKind): string {
  return kind === "roles" ? "Role" : "Venue";
}

export async function listTaxonomy(kind: TaxonomyKind): Promise<TaxonomyItem[]> {
  const rows =
    kind === "roles"
      ? await prisma.role.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, _count: { select: { staff: true } } },
        })
      : await prisma.venue.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, _count: { select: { staff: true } } },
        });

  return rows.map((r) => ({ id: r.id, name: r.name, staffCount: r._count.staff }));
}

export async function createTaxonomy(
  kind: TaxonomyKind,
  name: string,
): Promise<TaxonomyItem> {
  const row =
    kind === "roles"
      ? await prisma.role.create({ data: { name }, select: { id: true, name: true } })
      : await prisma.venue.create({ data: { name }, select: { id: true, name: true } });

  return { ...row, staffCount: 0 };
}

export async function renameTaxonomy(
  kind: TaxonomyKind,
  id: string,
  name: string,
): Promise<TaxonomyItem> {
  const row =
    kind === "roles"
      ? await prisma.role.update({
          where: { id },
          data: { name },
          select: { id: true, name: true, _count: { select: { staff: true } } },
        })
      : await prisma.venue.update({
          where: { id },
          data: { name },
          select: { id: true, name: true, _count: { select: { staff: true } } },
        });

  return { id: row.id, name: row.name, staffCount: row._count.staff };
}

/**
 * Deletes only when nothing is assigned.
 *
 * The join tables cascade on delete, so removing an in-use Role would silently
 * strip it from every staff member who holds it — an invisible, unauditable
 * edit to records this taxonomy doesn't own. Blocking forces the admin to
 * reassign first, which *is* audited on each staff record.
 */
export async function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
  const existing =
    kind === "roles"
      ? await prisma.role.findUnique({
          where: { id },
          select: { name: true, _count: { select: { staff: true } } },
        })
      : await prisma.venue.findUnique({
          where: { id },
          select: { name: true, _count: { select: { staff: true } } },
        });

  if (!existing) {
    throw new ApiError("NOT_FOUND", `${labelFor(kind)} not found.`);
  }

  if (existing._count.staff > 0) {
    const n = existing._count.staff;
    throw new ApiError(
      "CONFLICT",
      `"${existing.name}" is assigned to ${n} staff ${n === 1 ? "member" : "members"}. Reassign them before deleting it.`,
    );
  }

  if (kind === "roles") {
    await prisma.role.delete({ where: { id } });
  } else {
    await prisma.venue.delete({ where: { id } });
  }
}
