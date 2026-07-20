interface RoleListProps {
  roles: string[];
}

/** Renders staff role(s) as a labelled field. */
export default function RoleList({ roles }: RoleListProps) {
  const label = roles.length > 1 ? "Roles" : "Role";
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="mt-1 text-[15px] font-medium text-ink-soft">
        {roles.length ? roles.join(" · ") : "—"}
      </p>
    </div>
  );
}
