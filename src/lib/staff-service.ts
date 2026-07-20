import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma, StaffStatus } from "@/generated/prisma/client";
import type { StaffQuery } from "@/lib/validation";

/**
 * ---------------------------------------------------------------------------
 * Staff data access + shaping.
 * ---------------------------------------------------------------------------
 * Centralises the Prisma queries and the two DTO shapes the app exposes:
 *
 *   StaffDetail — full record, for the authenticated staff page & admin views
 *   PublicStaff — minimal public-safe subset, for /verify only
 *
 * Keeping the public projection in one place is what guarantees the public page
 * can never accidentally leak a field it shouldn't.
 * ---------------------------------------------------------------------------
 */

const staffInclude = {
  user: { select: { email: true } },
  roles: { include: { role: true } },
  venues: { include: { venue: true } },
} satisfies Prisma.StaffInclude;

async function findStaffRaw(where: Prisma.StaffWhereUniqueInput) {
  return prisma.staff.findUnique({ where, include: staffInclude });
}

export type StaffDetail = {
  id: string;
  stfId: string;
  name: string;
  email: string;
  photoUrl: string | null;
  status: StaffStatus;
  dateEngaged: string;
  roles: string[];
  venues: string[];
  verificationUrl: string;
};

/** The ONLY fields exposed on the public verification page. */
export type PublicStaff = {
  stfId: string;
  name: string;
  photoUrl: string | null;
  status: StaffStatus;
};

/** Absolute verification URL encoded into the QR code. */
export function buildVerificationUrl(stfId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/verify/${stfId}`;
}

function toDetail(staff: NonNullable<Awaited<ReturnType<typeof findStaffRaw>>>): StaffDetail {
  return {
    id: staff.id,
    stfId: staff.stfId,
    name: staff.name,
    email: staff.user.email,
    photoUrl: staff.photoUrl,
    status: staff.status,
    dateEngaged: staff.dateEngaged.toISOString(),
    roles: staff.roles.map((r) => r.role.name),
    venues: staff.venues.map((v) => v.venue.name),
    verificationUrl: buildVerificationUrl(staff.stfId),
  };
}

export async function getStaffById(id: string): Promise<StaffDetail | null> {
  const staff = await findStaffRaw({ id });
  return staff ? toDetail(staff) : null;
}

export async function getStaffByStfId(stfId: string): Promise<StaffDetail | null> {
  const staff = await findStaffRaw({ stfId });
  return staff ? toDetail(staff) : null;
}

/**
 * Public lookup — deliberately selects only public-safe columns at the database
 * level, so extra fields are never even loaded into memory.
 */
export async function getPublicStaffByStfId(stfId: string): Promise<PublicStaff | null> {
  return prisma.staff.findUnique({
    where: { stfId },
    select: { stfId: true, name: true, photoUrl: true, status: true },
  });
}

/** Admin list view with search + filters and pagination. */
export async function listStaff(query: StaffQuery) {
  const { q, status, role, venue, page, pageSize } = query;

  const where: Prisma.StaffWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { stfId: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(role ? { roles: { some: { role: { name: { equals: role, mode: "insensitive" } } } } } : {}),
    ...(venue ? { venues: { some: { venue: { name: { equals: venue, mode: "insensitive" } } } } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      include: staffInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    items: rows.map(toDetail),
  };
}

/** Suggests the next sequential STF-ID, e.g. "STF-000248". */
export async function suggestNextStfId(): Promise<string> {
  const latest = await prisma.staff.findFirst({
    orderBy: { stfId: "desc" },
    select: { stfId: true },
  });

  const lastNumber = latest ? Number.parseInt(latest.stfId.slice(4), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `STF-${String(next).padStart(6, "0")}`;
}

/**
 * Resolves role/venue names to rows, creating any that don't exist yet.
 * Lets an admin type a new venue inline instead of pre-seeding the taxonomy.
 */
export async function resolveNamesToIds(
  model: "role" | "venue",
  names: string[],
): Promise<string[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  // Branched rather than using a shared delegate variable: the Role and Venue
  // upsert signatures form a union TypeScript can't call generically.
  const rows = await Promise.all(
    unique.map((name) =>
      model === "role"
        ? prisma.role.upsert({
            where: { name },
            create: { name },
            update: {},
            select: { id: true },
          })
        : prisma.venue.upsert({
            where: { name },
            create: { name },
            update: {},
            select: { id: true },
          }),
    ),
  );
  return rows.map((row) => row.id);
}

export async function listRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}

export async function listVenues() {
  return prisma.venue.findMany({ orderBy: { name: "asc" } });
}

export async function getAuditLog(staffId: string) {
  return prisma.auditLog.findMany({
    where: { staffId },
    orderBy: { timestamp: "desc" },
    take: 100,
    include: { actor: { select: { email: true } } },
  });
}

/** Append-only audit write. Every state-changing admin action calls this. */
export async function writeAudit(params: {
  staffId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  return client.auditLog.create({
    data: {
      staffId: params.staffId,
      field: params.field,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      changedBy: params.changedBy,
    },
  });
}
