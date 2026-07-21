import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ResetPasswordForm from "@/app/reset-password/ResetPasswordForm";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Settings" };

/**
 * Staff settings.
 *
 * Password is the only thing a staff member owns — name, roles, venues and
 * status are all admin-controlled and audited, so nothing else is editable here.
 */
export default async function StaffSettingsPage() {
  const user = await getCurrentUser();
  if (!user?.staff) redirect("/login");

  return (
    <div>
      <PageHeader eyebrow="Account · Settings" title="Settings" />

      <div className="mt-6 max-w-xl">
        <section className="rounded-2xl bg-paper p-6 shadow-card">
          <h2 className="font-serif text-lg font-bold text-ink">Change password</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Choose a new password for {user.email}. You&apos;ll stay signed in on this
            device.
          </p>

          <ResetPasswordForm role="STAFF" currentPasswordLabel="Current password" />
        </section>

        <section className="mt-5 rounded-2xl bg-paper p-6 shadow-card">
          <h2 className="font-serif text-lg font-bold text-ink">Your record</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Your name, photo, roles, venues and employment status are managed by your
            administrator and every change is recorded in an audit log. Contact them if
            anything needs correcting.
          </p>
        </section>
      </div>
    </div>
  );
}
