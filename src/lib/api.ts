import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * ---------------------------------------------------------------------------
 * Shared API conventions
 * ---------------------------------------------------------------------------
 * Every route handler under `app/api/**` returns the same envelope and routes
 * every failure through `handle()`. Nothing here is reimplemented per-route.
 *
 *   success -> { success: true,  data: <payload> }
 *   failure -> { success: false, error: { code, message, details? } }
 * ---------------------------------------------------------------------------
 */

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Error codes used across the API. Keep this list closed and meaningful. */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** Throw from anywhere inside a route handler; `handle()` renders it. */
export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 200/201 success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Explicit failure envelope. */
export function fail(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    { success: false, error: { code, message, details } },
    { status: STATUS_BY_CODE[code], headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Wraps a route handler so every thrown error becomes a consistent envelope.
 * Unknown errors are logged server-side and reported as a generic 500 — internal
 * messages and stack traces are never leaked to the client.
 */
export async function handle<T>(fn: () => Promise<NextResponse<ApiResponse<T>>>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.code, error.message, error.details);
    }

    if (error instanceof ZodError) {
      return fail("VALIDATION_ERROR", "Request validation failed",
        error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    }

    // Prisma unique-constraint violation (e.g. duplicate STF-ID or email).
    if (isPrismaKnownError(error) && error.code === "P2002") {
      return fail("CONFLICT", `That ${describeConflictTarget(error)} is already in use.`);
    }

    // Prisma "record not found" for update/delete against a missing row.
    if (isPrismaKnownError(error) && error.code === "P2025") {
      return fail("NOT_FOUND", "The requested record no longer exists.");
    }

    console.error("[api] unhandled error:", error);
    return fail("INTERNAL", "Something went wrong. Please try again.");
  }
}

/**
 * Turns a P2002 constraint target into human wording. Prisma reports the target
 * as an array, a string, or omits it entirely depending on the driver, so all
 * three shapes are handled rather than falling through to "value".
 */
function describeConflictTarget(error: PrismaKnownError): string {
  const target = error.meta?.target;

  const raw = Array.isArray(target)
    ? target.join(", ")
    : typeof target === "string"
      ? target
      : "";

  // Constraint names arrive like "Staff_stfId_key" — keep just the column.
  const column = raw.replace(/^[A-Za-z]+_/, "").replace(/_key$/, "");

  const FRIENDLY: Record<string, string> = {
    stfId: "Staff ID",
    email: "email address",
    name: "name",
  };

  return FRIENDLY[column] ?? (column || "value");
}

type PrismaKnownError = { code: string; meta?: { target?: unknown } };

function isPrismaKnownError(error: unknown): error is PrismaKnownError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    (error as { code: string }).code.startsWith("P")
  );
}
