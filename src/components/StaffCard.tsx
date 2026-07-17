import Image from "next/image";
import type { StaffProfile } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import RoleList from "@/components/RoleList";
import VenueList from "@/components/VenueList";
import QrCode from "@/components/QrCode";
import ShareButton from "@/components/ShareButton";

interface StaffCardProps {
  staff: StaffProfile;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The premium Digital Staff ID card.
 * Fixed vertical rhythm: logo -> photo -> name/ID/status -> details -> QR -> actions.
 */
export default function StaffCard({ staff }: StaffCardProps) {
  return (
    <article className="animate-fade-scale-in w-full max-w-sm overflow-hidden rounded-3xl bg-paper shadow-card-lg">
      {/* Header — company logo */}
      <header className="flex flex-col items-center gap-4 px-8 pt-8">
        <Image
          src="/logo.svg"
          alt="LHP — Lion Hospitality Partners"
          width={112}
          height={60}
          priority
        />
        <p className="field-label">Digital Staff ID</p>
      </header>

      {/* Photo */}
      <div className="mt-6 flex justify-center">
        <div className="rounded-full bg-gradient-to-b from-brand-soft to-paper-sunken p-1.5 shadow-sm">
          <Image
            src={staff.photoUrl}
            alt={staff.fullName}
            width={128}
            height={128}
            className="h-32 w-32 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Name / ID / status */}
      <div className="mt-5 flex flex-col items-center gap-2 px-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {staff.fullName}
        </h1>
        <p className="font-mono text-sm font-medium tracking-wide text-ink-muted">
          {staff.staffId}
        </p>
        <div className="mt-1">
          <StatusBadge status={staff.status} />
        </div>
      </div>

      {/* Details */}
      <div className="mt-7 space-y-5 px-8">
        <div className="h-px bg-paper-sunken" />
        <RoleList roles={staff.roles} />
        <VenueList venues={staff.venues} />
        <div>
          <p className="field-label">Date Engaged</p>
          <p className="mt-1 text-[15px] font-medium text-ink-soft">
            {formatDate(staff.dateEngaged)}
          </p>
        </div>
      </div>

      {/* QR */}
      <div className="mt-7 flex justify-center px-8">
        <QrCode value={staff.verificationUrl} />
      </div>

      {/* Actions */}
      <div className="mt-7 px-8 pb-8">
        <ShareButton url={staff.verificationUrl} />
      </div>
    </article>
  );
}
