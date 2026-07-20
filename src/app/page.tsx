import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Role-aware entry point. Sends admins to the dashboard, staff to their ID
 * card, and everyone else to the login screen.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.mustResetPw) redirect("/reset-password");
  redirect(user.role === "ADMIN" ? "/admin" : "/staff");
}
