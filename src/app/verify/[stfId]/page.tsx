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
 *
 * Design intent: this is scanned off a badge by a guest or door supervisor,
 * on a phone, in venue lighting, at arm's length. The verdict is carried by
 * the full surface colour so it lands before a single word is read; the photo
 * is sized for a face match at that same distance. Everything else is
 * deliberately quiet — an ID check that shows more than it needs invites
 * scrutiny of the wrong things.
 */
export default async function VerifyPage({ params }: Props) {
  const { stfId } = await params;
  const staff = await getPublicStaffByStfId(decodeURIComponent(stfId).toUpperCase());
  const checkedAt = new Date();

  if (!staff) return <NotFoundView stfId={stfId} />;
  return staff.status === "ACTIVE" ? (
    <VerifiedView staff={staff} checkedAt={checkedAt} />
  ) : (
    <InvalidView staff={staff} checkedAt={checkedAt} />
  );
}

/* -------------------------------------------------------------------------- */

type Tone = "active" | "invalid" | "unknown";

const SURFACE: Record<Tone, string> = {
  active: "bg-verdict-active",
  invalid: "bg-verdict-invalid",
  unknown: "bg-verdict-unknown",
};

/**
 * Full-bleed verdict surface. The logo is knocked out to white rather than
 * boxed on a light chip — a white plate here would read as a second card and
 * compete with the photo.
 */
function Screen({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <main
      className={`verdict-backdrop flex min-h-svh flex-col items-center px-5 pb-10 pt-9 text-white ${SURFACE[tone]}`}
    >
      <Image
        src="/logo.svg"
        alt="LHP — Lion Hospitality Partners"
        width={82}
        height={44}
        priority
        className="shrink-0 opacity-80 brightness-0 invert"
      />

      <div className="animate-fade-scale-in flex w-full max-w-sm flex-1 flex-col items-center justify-center py-8 text-center">
        {children}
      </div>

      <p className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
        Lion Hospitality Partners
      </p>
    </main>
  );
}

/**
 * The one-glance answer. Solid white plate against the saturated ground gives
 * the highest contrast available on the screen, so it survives glare and a
 * dimmed phone.
 */
function Verdict({ tone, label }: { tone: Tone; label: string }) {
  const ink =
    tone === "active"
      ? "text-verdict-active"
      : tone === "invalid"
        ? "text-verdict-invalid"
        : "text-verdict-unknown";

  return (
    <div className="animate-badge-pop inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-2.5 shadow-card">
      {tone === "active" ? (
        <CheckIcon className={ink} />
      ) : tone === "invalid" ? (
        <CrossIcon className={ink} />
      ) : (
        <QueryIcon className={ink} />
      )}
      <span className={`text-[15px] font-bold uppercase tracking-[0.13em] ${ink}`}>
        {label}
      </span>
    </div>
  );
}

/** Photo framed for a face match, not decoration — hence the 128px floor. */
function Portrait({
  staff,
  muted = false,
}: {
  staff: PublicStaff;
  muted?: boolean;
}) {
  return (
    <div className="rounded-full bg-white/10 p-1.5 ring-1 ring-inset ring-white/25">
      <StaffPhoto
        src={staff.photoUrl}
        name={staff.name}
        size={128}
        className={muted ? "opacity-60 grayscale" : ""}
      />
    </div>
  );
}

function Identity({ staff }: { staff: PublicStaff }) {
  return (
    <>
      <h1 className="mt-6 text-pretty font-serif text-[30px] font-bold leading-tight tracking-tight">
        {staff.name}
      </h1>
      <p className="mt-2 font-mono text-sm font-medium tracking-[0.08em] text-white/65">
        {staff.stfId}
      </p>
    </>
  );
}

function Timestamp({ label, at }: { label: string; at: Date }) {
  return (
    <p className="mt-8 border-t border-white/15 pt-5 text-xs leading-relaxed text-white/55">
      {label} {formatDateTime(at)}
    </p>
  );
}

/* -------------------------------------------------------------------------- */

function VerifiedView({ staff, checkedAt }: { staff: PublicStaff; checkedAt: Date }) {
  return (
    <Screen tone="active">
      <Portrait staff={staff} />
      <Identity staff={staff} />

      <div className="mt-7">
        <Verdict tone="active" label="Verified staff" />
      </div>

      <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-verdict-active-ink">
        This badge is active and issued by Lion Hospitality Partners.
      </p>

      <Timestamp label="Checked" at={checkedAt} />
    </Screen>
  );
}

function InvalidView({ staff, checkedAt }: { staff: PublicStaff; checkedAt: Date }) {
  return (
    <Screen tone="invalid">
      <Portrait staff={staff} muted />
      <Identity staff={staff} />

      <div className="mt-7">
        <Verdict tone="invalid" label="Not valid" />
      </div>

      <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-verdict-invalid-ink">
        This person is no longer affiliated with Lion Hospitality Partners. Do not
        accept this badge.
      </p>

      <Timestamp label="Checked" at={checkedAt} />
    </Screen>
  );
}

/**
 * Unknown code. Deliberately neutral rather than red — a mistyped or damaged
 * code is not an accusation, and colouring it as one trains staff to ignore
 * the real red.
 */
function NotFoundView({ stfId }: { stfId: string }) {
  return (
    <Screen tone="unknown">
      <Verdict tone="unknown" label="No record" />

      <h1 className="mt-7 text-balance font-serif text-[26px] font-bold leading-tight tracking-tight">
        This code isn&apos;t recognised
      </h1>

      <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-verdict-unknown-ink">
        It doesn&apos;t match any staff record. The badge may be mistyped, damaged,
        or not issued by LHP.
      </p>

      <p className="mt-7 max-w-full break-all rounded-2xl bg-white/[0.07] px-4 py-3 font-mono text-xs text-white/60">
        {decodeURIComponent(stfId)}
      </p>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function QueryIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M12 16.5h.01M9.6 9.4a2.5 2.5 0 114 2.2c-.9.6-1.6 1-1.6 2"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
