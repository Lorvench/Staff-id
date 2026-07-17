import { NextResponse } from "next/server";
import { getCurrentStaffProfile } from "@/lib/mock-backend";

/**
 * GET /api/staff
 * Returns the authenticated staff member's profile + QR verification URL.
 * In production this reads the session/token and proxies the real backend.
 */
export async function GET() {
  // Simulated network latency so loading states are visible in the demo.
  await new Promise((r) => setTimeout(r, 600));

  const profile = getCurrentStaffProfile();
  return NextResponse.json(profile);
}
