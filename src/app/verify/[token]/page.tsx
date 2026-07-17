import Image from "next/image";
import Link from "next/link";
import { verifyToken } from "@/lib/mock-backend";
import type { PublicStaffInfo } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import RoleList from "@/components/RoleList";
import VenueList from "@/components/VenueList";

// Always render live status at request time — never a cached "verified" state.
export const dynamic = "force-dynamic";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // In production this is a server-side fetch to the backend; here it resolves
  // against the mock backend. The result is authoritative and un-tamperable.
  const result = verifyToken(token);

  return (
    <main className="page-backdrop flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {result.outcome === "VERIFIED" && (
        <VerifiedCard staff={result.staff} verifiedAt={result.verifiedAt} />
      )}
      {result.outcome === "DISENGAGED" && (
        <DisengagedCard staff={result.staff} />
      )}
      {result.outcome === "NOT_FOUND" && <NotFoundCard />}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Verified (ACTIVE)                                                   */
/* ------------------------------------------------------------------ */
function VerifiedCard({
  staff,
  verifiedAt,
}: {
  staff: PublicStaffInfo;
  verifiedAt: string;
}) {
  return (
    <article className="animate-fade-scale-in w-full max-w-sm overflow-hidden rounded-3xl bg-paper shadow-card-lg">
      <div className="flex flex-col items-center gap-3 border-b border-paper-sunken px-8 pt-8 pb-6">
        <Image src="/logo.svg" alt="LHP — Lion Hospitality Partners" width={100} height={53} priority />
        <div className="mt-2 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 animate-badge-pop items-center justify-center rounded-full bg-active-soft text-active">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-active-ink">
            VERIFIED STAFF
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center px-8 pt-7 text-center">
        <div className="rounded-full bg-gradient-to-b from-active-soft to-paper-sunken p-1.5 shadow-sm">
          <Image
            src={staff.photoUrl}
            alt={staff.fullName}
            width={104}
            height={104}
            className="h-[104px] w-[104px] rounded-full object-cover"
          />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink">
          {staff.fullName}
        </h2>
        <p className="mt-1 font-mono text-sm font-medium tracking-wide text-ink-muted">
          {staff.staffId}
        </p>
      </div>

      <div className="mt-6 space-y-5 px-8 text-left">
        <div className="h-px bg-paper-sunken" />
        <RoleList roles={staff.roles} />
        <VenueList venues={staff.venues} />
        <div>
          <p className="field-label">Status</p>
          <div className="mt-2">
            <StatusBadge status="ACTIVE" size="lg" />
          </div>
        </div>
      </div>

      <div className="mt-7 border-t border-paper-sunken px-8 py-4">
        <p className="text-center text-xs text-ink-muted">
          Verified {formatTime(verifiedAt)}
        </p>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Invalid (DISENGAGED)                                                */
/* ------------------------------------------------------------------ */
function DisengagedCard({ staff }: { staff: PublicStaffInfo }) {
  return (
    <article className="animate-fade-scale-in w-full max-w-sm overflow-hidden rounded-3xl bg-paper shadow-card-lg">
      <div className="flex flex-col items-center gap-3 border-b border-paper-sunken px-8 pt-8 pb-6">
        <Image src="/logo.svg" alt="LHP — Lion Hospitality Partners" width={100} height={53} priority />
        <div className="mt-2 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 animate-badge-pop items-center justify-center rounded-full bg-disengaged-soft text-disengaged">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 7l10 10M17 7L7 17"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-disengaged-ink">
            STAFF ID INVALID
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center px-8 pt-7 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          {staff.fullName}
        </h2>
        <p className="mt-1 font-mono text-sm font-medium tracking-wide text-ink-muted">
          {staff.staffId}
        </p>
        <div className="mt-4">
          <StatusBadge status="DISENGAGED" size="lg" />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          This staff member is no longer affiliated with the organization.
        </p>
      </div>

      <div className="mt-7 px-8 pb-8" />
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Token not found / expired / malformed                               */
/* ------------------------------------------------------------------ */
function NotFoundCard() {
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
      <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-paper-sunken text-ink-muted">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 8v5M12 16.5h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight text-ink">
        Verification link invalid
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This QR code or link is not recognized. It may be expired, incomplete,
        or mistyped. Ask the staff member to reopen their Digital Staff ID and
        try again.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-paper-sunken px-5 py-2.5 text-sm font-semibold text-ink-soft transition active:scale-[0.98] hover:bg-paper-sunken/70"
      >
        Back to home
      </Link>
    </article>
  );
}
