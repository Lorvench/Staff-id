import "server-only";

import { ApiError } from "@/lib/api";

/**
 * Minimal fixed-window rate limiter for the login endpoint.
 *
 * In-memory and therefore per-instance: adequate for a single server or a
 * modest deployment, but it resets on redeploy and does not coordinate across
 * serverless instances. Swap the Map for Redis (Upstash) if this is ever
 * horizontally scaled — the call sites do not change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60_000; // 15 minutes
const MAX_ATTEMPTS = 10;

export function enforceRateLimit(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  bucket.count += 1;

  if (bucket.count > MAX_ATTEMPTS) {
    const minutes = Math.ceil((bucket.resetAt - now) / 60_000);
    throw new ApiError(
      "RATE_LIMITED",
      `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }
}

/** Clears the bucket after a successful login so honest users aren't punished. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client identifier from proxy headers. */
export function clientKey(request: Request, suffix = ""): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${suffix}`;
}
