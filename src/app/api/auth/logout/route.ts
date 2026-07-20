import { handle, ok } from "@/lib/api";
import { logout } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout — Authenticated
 *
 * Request:  (no body)
 * Response: { success: true, data: { loggedOut: true } }
 *
 * Deletes the DB session row and clears the cookie. Idempotent: calling it
 * without a valid session still succeeds.
 */
export async function POST() {
  return handle(async () => {
    await logout();
    return ok({ loggedOut: true });
  });
}
