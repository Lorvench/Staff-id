import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStaffById } from "@/lib/staff-service";
import StaffCard from "@/components/StaffCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Staff ID" };

/**
 * Digital Staff ID — authenticated, self-only, server-rendered.
 *
 * The record is resolved from the session, never from a URL parameter, so a
 * staff member can only ever load their own card. Read-only by construction:
 * this page renders no mutation affordance for role, venue, or status.
 */
export default async function StaffIdPage() {
  const user = await getCurrentUser();
  if (!user?.staff) redirect("/login");

  const staff = await getStaffById(user.staff.id);

  if (!staff) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl bg-paper p-10 text-center shadow-card">
          <h1 className="text-lg font-semibold text-ink">No staff profile</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            We couldn&apos;t find a staff record linked to your account. Please
            contact your administrator.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <StaffCard staff={staff} />
    </main>
  );
}
