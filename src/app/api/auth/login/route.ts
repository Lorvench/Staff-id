import { handle, ok } from "@/lib/api";
import { login } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { clientKey, enforceRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login — Public
 *
 * Request:  { email: string, password: string }
 * Response: { success: true, data: { id, email, role, mustResetPw, staff } }
 * Errors:   401 UNAUTHENTICATED (bad credentials)
 *           403 FORBIDDEN       (account disengaged)
 *           422 VALIDATION_ERROR
 *           429 RATE_LIMITED    (10 attempts / 15 min per IP)
 *
 * On success sets the httpOnly `lhp_session` cookie backed by a DB session row.
 */
export async function POST(request: Request) {
  return handle(async () => {
    const key = clientKey(request, "login");
    enforceRateLimit(key);

    const body = loginSchema.parse(await request.json());
    const user = await login(body.email, body.password);

    resetRateLimit(key);
    return ok(user);
  });
}
