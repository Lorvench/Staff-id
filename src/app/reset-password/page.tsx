import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set a new password" };

/**
 * First-login forced password reset.
 *
 * Reached automatically whenever `mustResetPw` is set — on a newly created
 * account, and after any DISENGAGED -> ACTIVE reactivation.
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const forced = user.mustResetPw;

  return (
    <main className="page-backdrop flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="animate-fade-scale-in w-full max-w-sm rounded-3xl bg-paper p-8 shadow-card-lg">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt="LHP — Lion Hospitality Partners"
            width={104}
            height={55}
            priority
          />
          <h1 className="mt-6 text-xl font-bold tracking-tight text-ink">
            {forced ? "Set your password" : "Change your password"}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {forced
              ? "For your security, choose a new password before continuing."
              : "Choose a new password for your account."}
          </p>
        </div>

        <ResetPasswordForm
          role={user.role}
          currentPasswordLabel={forced ? "Temporary password" : "Current password"}
        />
      </div>
    </main>
  );
}
