import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppBar from "@/components/AppBar";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Admin route guard. Mirrors `requireAdmin()` at the page boundary — a STAFF
 * user hitting /admin by typing the URL is redirected, and the API routes
 * enforce the same rule independently so neither layer is the only defence.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.mustResetPw) redirect("/reset-password");
  if (user.role !== "ADMIN") redirect("/staff");

  return (
    <div className="page-backdrop flex min-h-screen flex-col">
      <AppBar email={user.email} nav={<AdminNav />} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
