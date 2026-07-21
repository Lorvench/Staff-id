import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * ---------------------------------------------------------------------------
 * Seed
 * ---------------------------------------------------------------------------
 * 1. Bootstrap administrator — without this nobody can sign in to create the
 *    first staff member, since staff accounts are only created by admins.
 * 2. Baseline roles and venues.
 * 3. Two demo staff members (one ACTIVE, one DISENGAGED) so both verification
 *    states can be demonstrated immediately.
 *
 * Idempotent: safe to re-run. Uses upserts throughout.
 * ---------------------------------------------------------------------------
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ROLES = [
  "Guest Relations Officer",
  "Floor Supervisor",
  "Events Host",
  "Concierge",
  "Security Officer",
  "Head Chef",
];

const VENUES = [
  "The Lion's Den, Lagos",
  "LHP Suites, Abuja",
  "Savannah Grill, Port Harcourt",
  "Mane Lounge, Lagos",
];

async function main() {
  // --- 1. Bootstrap admin --------------------------------------------------
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@lhp.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set — cannot seed the bootstrap admin");
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
      mustResetPw: false,
    },
  });
  console.log(`✓ Admin ready: ${admin.email}`);

  // --- 2. Taxonomy ---------------------------------------------------------
  await Promise.all(
    ROLES.map((name) =>
      prisma.role.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  await Promise.all(
    VENUES.map((name) =>
      prisma.venue.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );
  console.log(`✓ ${ROLES.length} roles, ${VENUES.length} venues`);

  // --- 3. Demo staff -------------------------------------------------------
  await seedStaff({
    stfId: "STF-000247",
    name: "John Doe",
    email: "john.doe@lhp.com",
    password: "Staff@1234",
    status: "ACTIVE",
    dateEngaged: new Date("2025-01-12"),
    roles: ["Guest Relations Officer"],
    venues: ["The Lion's Den, Lagos", "LHP Suites, Abuja"],
  });

  await seedStaff({
    stfId: "STF-000512",
    name: "Amaka Obi",
    email: "amaka.obi@lhp.com",
    password: "Staff@1234",
    status: "DISENGAGED",
    dateEngaged: new Date("2023-06-03"),
    roles: ["Floor Supervisor", "Events Host"],
    venues: ["Savannah Grill, Port Harcourt"],
  });

  console.log("✓ Demo staff seeded");
}

async function seedStaff(input: {
  stfId: string;
  name: string;
  email: string;
  password: string;
  photoUrl?: string | null;
  status: "ACTIVE" | "DISENGAGED";
  dateEngaged: Date;
  roles: string[];
  venues: string[];
}) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    // Re-seeding restores the demo accounts to a clean, ready-to-demo state.
    update: { mustResetPw: false },
    create: {
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "STAFF",
      mustResetPw: false, // demo accounts skip the forced reset for convenience
    },
  });

  const staff = await prisma.staff.upsert({
    where: { stfId: input.stfId },
    update: {
      name: input.name,
      photoUrl: input.photoUrl ?? null,
      status: input.status,
      dateEngaged: input.dateEngaged,
    },
    create: {
      stfId: input.stfId,
      name: input.name,
      photoUrl: input.photoUrl ?? null,
      status: input.status,
      dateEngaged: input.dateEngaged,
      userId: user.id,
    },
  });

  const roles = await prisma.role.findMany({ where: { name: { in: input.roles } } });
  const venues = await prisma.venue.findMany({ where: { name: { in: input.venues } } });

  await prisma.staffRole.deleteMany({ where: { staffId: staff.id } });
  await prisma.staffVenue.deleteMany({ where: { staffId: staff.id } });

  await prisma.staffRole.createMany({
    data: roles.map((r) => ({ staffId: staff.id, roleId: r.id })),
  });
  await prisma.staffVenue.createMany({
    data: venues.map((v) => ({ staffId: staff.id, venueId: v.id })),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
