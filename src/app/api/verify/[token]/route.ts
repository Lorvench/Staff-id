import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/mock-backend";

/**
 * GET /api/verify/:token
 * Resolves a verification token to a live employment status.
 * Always reflects current backend state — never a cached "verified" result.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = verifyToken(token);

  const status = result.outcome === "NOT_FOUND" ? 404 : 200;
  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
