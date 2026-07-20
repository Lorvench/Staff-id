import Image from "next/image";

/**
 * Staff avatar. Falls back to monogrammed initials when no photo is set, so a
 * missing image never renders as a broken frame.
 *
 * Uploaded photos are stored as data URIs (see PhotoUpload), which Next's
 * image optimizer cannot process — those are passed through `unoptimized`,
 * while files served from /public take the normal optimization path.
 */
export default function StaffPhoto({
  src,
  name,
  size = 128,
  className = "",
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (!src) {
    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold tracking-tight text-brand ${className}`}
        aria-label={name}
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized={src.startsWith("data:")}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
