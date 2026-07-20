import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppBar from "@/components/AppBar";

export const dynamic = "force-dynamic";

/**
 * Staff route guard.
 *
 * Mirrors `requireStaff()` but redirects instead of throwing, since this is a
 * page boundary rather than an API call. The live status re-read is the point:
 * an admin disengaging someone mid-session locks them out on their next
 * navigation, not at cookie expiry.
 */
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.staff) redirect("/login");
  if (user.mustResetPw) redirect("/reset-password");

  const current = await prisma.staff.findUnique({
    where: { id: user.staff.id },
    select: { status: true },
  });

  if (!current || current.status === "DISENGAGED") {
    redirect("/login?reason=disengaged");
  }

  return (
    <div className="page-backdrop flex min-h-screen flex-col">
      <AppBar email={user.email} />
      {children}
    </div>
  );
}
