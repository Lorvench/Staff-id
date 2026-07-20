import "server-only";

import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { StaffStatus, User } from "@/generated/prisma/client";

/**
 * ---------------------------------------------------------------------------
 * Auth — BFF pattern, DB-backed revocable sessions.
 * ---------------------------------------------------------------------------
 * The browser holds an opaque random token in an httpOnly cookie. The database
 * stores only its HMAC, so leaking the Session table never yields a usable
 * cookie. Every request resolves the session against the DB, which is what
 * makes revocation instant — unlike a self-contained JWT.
 * ---------------------------------------------------------------------------
 */

const COOKIE_NAME = "lhp_session";
const SESSION_TTL_DAYS = 7;
const BCRYPT_ROUNDS = 12;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short — check your .env");
  }
  return secret;
}

/** Opaque token id stored as the Session primary key. */
function tokenId(rawToken: string): string {
  return createHmac("sha256", sessionSecret()).update(rawToken).digest("hex");
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Cryptographically random temporary password for newly onboarded staff. */
export function generateTempPassword(): string {
  // Ambiguous characters (0/O, 1/l/I) removed — these get read aloud and typed.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  mustResetPw: boolean;
  staff: { id: string; stfId: string; name: string; status: StaffStatus } | null;
};

/**
 * Verify credentials, create a DB session, and set the session cookie.
 * Throws ApiError("UNAUTHENTICATED") on bad credentials — deliberately the same
 * message for unknown-email and wrong-password so the endpoint can't be used to
 * enumerate which emails exist.
 */
export async function login(email: string, plainPassword: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { staff: true },
  });

  const invalid = () =>
    new ApiError("UNAUTHENTICATED", "Incorrect email or password.");

  if (!user) {
    // Hash anyway so response timing doesn't reveal whether the email exists.
    await bcrypt.compare(plainPassword, "$2a$12$" + "x".repeat(53));
    throw invalid();
  }

  if (!(await verifyPassword(plainPassword, user.passwordHash))) {
    throw invalid();
  }

  // Live status check — a disengaged staff member cannot obtain a new session.
  if (user.role === "STAFF" && user.staff?.status === "DISENGAGED") {
    throw new ApiError(
      "FORBIDDEN",
      "This staff account is no longer active. Contact your administrator.",
    );
  }

  await createSession(user.id);
  return toSessionUser(user, user.staff);
}

async function createSession(userId: string): Promise<void> {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await prisma.session.create({
    data: { id: tokenId(rawToken), userId, expiresAt },
  });

  const jar = await cookies();
  jar.set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Resolve the current user from the session cookie.
 * Expired sessions are deleted on encounter (opportunistic cleanup).
 * Returns null when unauthenticated — never throws.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const rawToken = jar.get(COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const session = await prisma.session.findUnique({
    where: { id: tokenId(rawToken) },
    include: { user: { include: { staff: true } } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return toSessionUser(session.user, session.user.staff);
}

/** Revoke the caller's own session and clear the cookie. */
export async function logout(): Promise<void> {
  await revokeCurrentSession();
}

export async function revokeCurrentSession(): Promise<void> {
  const jar = await cookies();
  const rawToken = jar.get(COOKIE_NAME)?.value;

  if (rawToken) {
    await prisma.session
      .delete({ where: { id: tokenId(rawToken) } })
      .catch(() => {}); // already gone is a success for our purposes
  }
  jar.delete(COOKIE_NAME);
}

/**
 * Kill every active session for a staff member. Called whenever a staff member
 * is disengaged so that an already-signed-in browser is locked out immediately
 * rather than at next natural expiry.
 */
export async function revokeAllSessionsForStaff(staffId: string): Promise<number> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { userId: true },
  });
  if (!staff) return 0;

  const { count } = await prisma.session.deleteMany({
    where: { userId: staff.userId },
  });
  return count;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/** Any authenticated user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("UNAUTHENTICATED", "You must be signed in.");
  }
  return user;
}

/** Administrators only. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ApiError("FORBIDDEN", "Administrator access required.");
  }
  return user;
}

/**
 * Staff only, with a LIVE status check on every call — not merely at login.
 * If an admin disengages someone mid-session, the very next request fails here
 * even though the session cookie is still syntactically valid.
 */
export async function requireStaff(): Promise<SessionUser & { staff: NonNullable<SessionUser["staff"]> }> {
  const user = await requireUser();

  if (user.role !== "STAFF" || !user.staff) {
    throw new ApiError("FORBIDDEN", "Staff access required.");
  }

  // Re-read status from the database rather than trusting the session snapshot.
  const current = await prisma.staff.findUnique({
    where: { id: user.staff.id },
    select: { status: true },
  });

  if (!current || current.status === "DISENGAGED") {
    await revokeCurrentSession();
    throw new ApiError(
      "FORBIDDEN",
      "This staff account is no longer active.",
    );
  }

  return user as SessionUser & { staff: NonNullable<SessionUser["staff"]> };
}

/** Constant-time compare, used where a plain equality check would leak timing. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------

type StaffSnippet = {
  id: string;
  stfId: string;
  name: string;
  status: StaffStatus;
} | null;

function toSessionUser(user: User, staff: StaffSnippet): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    mustResetPw: user.mustResetPw,
    staff: staff
      ? { id: staff.id, stfId: staff.stfId, name: staff.name, status: staff.status }
      : null,
  };
}
