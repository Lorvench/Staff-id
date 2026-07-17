import type { EmploymentStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: EmploymentStatus;
  /** Larger treatment for the verification hero. */
  size?: "sm" | "lg";
  /** Entrance pop — used on the public verification page. */
  animated?: boolean;
}

const CONFIG: Record<
  EmploymentStatus,
  { label: string; dot: string; wrap: string }
> = {
  ACTIVE: {
    label: "ACTIVE",
    dot: "bg-active",
    wrap: "bg-active-soft text-active-ink",
  },
  DISENGAGED: {
    label: "DISENGAGED",
    dot: "bg-disengaged",
    wrap: "bg-disengaged-soft text-disengaged-ink",
  },
};

export default function StatusBadge({
  status,
  size = "sm",
  animated = false,
}: StatusBadgeProps) {
  const { label, dot, wrap } = CONFIG[status];
  const sizing =
    size === "lg"
      ? "px-4 py-1.5 text-sm tracking-[0.12em]"
      : "px-3 py-1 text-xs tracking-[0.1em]";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold ${wrap} ${sizing} ${
        animated ? "animate-badge-pop" : ""
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
