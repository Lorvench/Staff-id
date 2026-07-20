import type { Metadata } from "next";
import Image from "next/image";
import { getPublicStaffByStfId, type PublicStaff } from "@/lib/staff-service";
import { formatDateTime } from "@/lib/format";
import StaffPhoto from "@/components/StaffPhoto";

/**
 * Status must never be served from a static cache — a staff member disengaged
 * a second ago must read as invalid on the very next scan.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Verification",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ stfId: string }> };

/**
 * Public verification page — no authentication.
 *
 * Renders one of three states: VERIFIED, INVALID (disengaged), or NOT FOUND.
 * Reads live from the database at request time and shows only the minimal
 * public-safe field set (name, photo, STF-ID, status).
 */
export default async function VerifyPage({ params }: Props) {
  const { stfId } = await params;
  const staff = await getPublicStaffByStfId(decodeURIComponent(stfId).toUpperCase());
  const verifiedAt = new Date();

  return (
    <main className="page-backdrop flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {!staff ? (
        <NotFoundView stfId={stfId} />
      ) : staff.status === "ACTIVE" ? (
        <VerifiedView staff={staff} verifiedAt={verifiedAt} />
      ) : (
        <InvalidView staff={staff} verifiedAt={verifiedAt} />
      )}

      <p className="mt-6 text-center text-xs text-ink-faint">
        Lion Hospitality Partners · Staff Verification
      </p>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <article className="animate-fade-scale-in w-full max-w-sm overflow-hidden rounded-3xl bg-paper px-8 py-10 text-center shadow-card-lg">
      <Image
        src="/logo.svg"
        alt="LHP — Lion Hospitality Partners"
        width={100}
        height={53}
        className="mx-auto"
        priority
      />
      {children}
    </article>
  );
}

function VerifiedView({
  staff,
  verifiedAt,
}: {
  staff: PublicStaff;
  verifiedAt: Date;
}) {
  return (
    <Shell>
      {/* The badge is the largest element — readable in under a second. */}
      <div className="animate-badge-pop mt-7 inline-flex items-center gap-2 rounded-full bg-active-soft px-4 py-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" className="text-active" />
          <path
            d="M8 12.5l2.5 2.5L16 9.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-bold uppercase tracking-[0.12em] text-active-ink">
          Verified Staff
        </span>
      </div>

      <div className="mt-7 flex justify-center">
        <div className="rounded-full bg-gradient-to-b from-brand-soft to-paper-sunken p-1.5 shadow-sm">
          <StaffPhoto src={staff.photoUrl} name={staff.name} size={116} />
        </div>
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{staff.name}</h1>
      <p className="mt-1 font-mono text-sm font-medium tracking-wide text-ink-muted">
        {staff.stfId}
      </p>

      <div className="mt-7 h-px bg-paper-sunken" />

      <div className="mt-5">
        <p className="field-label">Status</p>
        <p className="mt-1 text-base font-bold tracking-tight text-active-ink">ACTIVE</p>
      </div>

      <p className="mt-7 text-xs leading-relaxed text-ink-faint">
        Verified {formatDateTime(verifiedAt)}
      </p>
    </Shell>
  );
}

function InvalidView({
  staff,
  verifiedAt,
}: {
  staff: PublicStaff;
  verifiedAt: Date;
}) {
  return (
    <Shell>
      <div className="animate-badge-pop mt-7 inline-flex items-center gap-2 rounded-full bg-disengaged-soft px-4 py-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="currentColor" className="text-disengaged" />
          <path
            d="M9 9l6 6M15 9l-6 6"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-bold uppercase tracking-[0.12em] text-disengaged-ink">
          Staff ID Invalid
        </span>
      </div>

      <div className="mt-7 flex justify-center">
        <div className="rounded-full bg-paper-sunken p-1.5">
          <StaffPhoto
            src={staff.photoUrl}
            name={staff.name}
            size={116}
            className="opacity-50 grayscale"
          />
        </div>
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">{staff.name}</h1>
      <p className="mt-1 font-mono text-sm font-medium tracking-wide text-ink-muted">
        {staff.stfId}
      </p>

      <div className="mt-7 h-px bg-paper-sunken" />

      <div className="mt-5">
        <p className="field-label">Status</p>
        <p className="mt-1 text-base font-bold tracking-tight text-disengaged-ink">
          DISENGAGED
        </p>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-ink-muted">
        This staff member is no longer affiliated with the organization.
      </p>

      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        Checked {formatDateTime(verifiedAt)}
      </p>
    </Shell>
  );
}

function NotFoundView({ stfId }: { stfId: string }) {
  return (
    <Shell>
      <div className="mt-8 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper-sunken text-ink-muted">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 7.5v5M12 16.2h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <h1 className="mt-5 text-lg font-bold tracking-tight text-ink">
        Verification link invalid
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This code doesn&apos;t match any staff record. It may be mistyped, expired,
        or not issued by LHP.
      </p>

      <p className="mt-6 break-all font-mono text-xs text-ink-faint">
        {decodeURIComponent(stfId)}
      </p>
    </Shell>
  );
}
