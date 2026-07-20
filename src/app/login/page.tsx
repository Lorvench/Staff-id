import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage() {
  // Already signed in? Don't show the form again.
  const user = await getCurrentUser();
  if (user) {
    if (user.mustResetPw) redirect("/reset-password");
    redirect(user.role === "ADMIN" ? "/admin" : "/staff");
  }

  return (
    <main className="page-backdrop flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="animate-fade-scale-in w-full max-w-sm rounded-3xl bg-paper p-8 shadow-card-lg">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt="LHP — Lion Hospitality Partners"
            width={120}
            height={64}
            priority
          />
          <h1 className="mt-6 text-xl font-bold tracking-tight text-ink">Staff Sign In</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Access your Digital Staff ID
          </p>
        </div>

        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        Lion Hospitality Partners · Digital Staff ID
      </p>
    </main>
  );
}
