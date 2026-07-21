import Image from "next/image";
import type { StaffDetail } from "@/lib/staff-service";
import StaffPhoto from "@/components/StaffPhoto";
import StatusBadge from "@/components/StatusBadge";
import QrCode from "@/components/QrCode";
import ShareButton from "@/components/ShareButton";
import PageHeader from "@/components/ui/PageHeader";
import { formatLongDate } from "@/lib/format";

/**
 * The staff member's own record.
 *
 * Read-only by construction — roles, venues, status and Staff ID are all
 * admin-owned and audited, so this screen renders no mutation affordance for
 * any of them. The only thing a staff member can change is their password,
 * which lives under Settings.
 */
export default function StaffDashboard({ staff }: { staff: StaffDetail }) {
  return (
    <div>
      <PageHeader eyebrow="Account · My record" title="Dashboard" />

      {/* Identity banner */}
      <section className="mt-6 overflow-hidden rounded-2xl bg-paper shadow-card">
        <div className="relative h-28 bg-gradient-to-r from-[#1c2233] to-[#2f3a52]">
          <Image
            src="/logo.svg"
            alt=""
            width={72}
            height={38}
            aria-hidden
            className="absolute right-6 top-6 opacity-25 invert"
          />
        </div>

        <div className="px-6 pb-6">
          {/* `relative` so this row paints above the banner, which is itself
              positioned — without it the banner covers the avatar's top half. */}
          <div className="relative -mt-11 flex flex-wrap items-end gap-4">
            <div className="rounded-2xl bg-paper p-1.5 shadow-card">
              <StaffPhoto src={staff.photoUrl} name={staff.name} size={88} />
            </div>

            <div className="min-w-0 flex-1 pb-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[26px] font-normal leading-none text-ink">
                  {staff.name}
                </h2>
                <StatusBadge status={staff.status} />
              </div>
              <p className="mt-1.5 font-mono text-[13px] text-ink-muted">{staff.stfId}</p>
            </div>
          </div>

          {/* Stat strip. Status is deliberately absent — the badge beside the
              name already carries it. */}
          <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-paper-sunken pt-5 sm:grid-cols-3 sm:divide-x sm:divide-paper-sunken">
            <Stat label="Role(s)" value={staff.roles.join(" · ") || "—"} />
            <Stat label="Venue(s)" value={staff.venues.join(" · ") || "—"} className="sm:pl-5" />
            <Stat
              label="Date Engaged"
              value={formatLongDate(staff.dateEngaged)}
              className="sm:pl-5"
            />
          </dl>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left column */}
        <div className="space-y-5">
          <Card icon={<ProfileIcon />} title="Profile">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" value={staff.name} />
              <Field label="Staff ID" value={staff.stfId} mono />
              <Field label="Login email" value={staff.email} />
              <Field label="Date engaged" value={formatLongDate(staff.dateEngaged)} />
            </dl>
          </Card>

          <Card icon={<AssignmentIcon />} title="Assignment">
            <p className="-mt-1 mb-4 text-[13px] leading-relaxed text-ink-muted">
              Set by your administrator. Contact them if anything here is out of date.
            </p>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Role(s)" value={staff.roles.join(" · ") || "None assigned"} />
              <Field label="Venue(s)" value={staff.venues.join(" · ") || "None assigned"} />
            </dl>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <section className="rounded-2xl bg-paper p-5 shadow-card">
            <h3 className="font-serif text-base font-bold text-ink">Your digital ID</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              Anyone scanning this sees your name, photo and current status — nothing
              else.
            </p>

            <div className="mt-4 flex justify-center">
              <QrCode value={staff.verificationUrl} size={160} />
            </div>

            <div className="mt-4 flex justify-center">
              <ShareButton url={staff.verificationUrl} />
            </div>

            <a
              href={staff.verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-center text-xs font-semibold text-brand hover:underline"
            >
              Open public verification page →
            </a>
          </section>

          <section className="rounded-2xl bg-paper p-5 shadow-card">
            <h3 className="font-serif text-base font-bold text-ink">Employment status</h3>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={staff.status} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              {staff.status === "ACTIVE"
                ? "Your ID reads as VERIFIED on any public scan."
                : "Your ID reads as INVALID on any public scan. Contact your administrator."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="field-label">{label}</dt>
      {/* Wraps rather than truncates — a staff member with several venues would
          otherwise silently lose the tail. */}
      <dd className="mt-1 text-[15px] font-semibold leading-snug text-ink">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className={`mt-1 break-words text-[15px] text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-paper p-6 shadow-card">
      <header className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand">
          {icon}
        </span>
        <h3 className="font-serif text-lg font-bold text-ink">{title}</h3>
      </header>
      {children}
    </section>
  );
}

const ProfileIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h9l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

const AssignmentIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 19v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 17.5V19" />
    <circle cx="10" cy="8" r="3.2" />
    <path d="M19 19v-1.5a3.5 3.5 0 00-2.6-3.38" />
  </svg>
);
