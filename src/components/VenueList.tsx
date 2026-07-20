interface VenueListProps {
  venues: string[];
}

/** Renders assigned venue(s) as a labelled field with subtle chips. */
export default function VenueList({ venues }: VenueListProps) {
  const label = venues.length > 1 ? "Venues" : "Venue";
  return (
    <div>
      <p className="field-label">{label}</p>
      {venues.length === 0 && (
        <p className="mt-1 text-[15px] font-medium text-ink-soft">—</p>
      )}
      <ul className="mt-2 flex flex-wrap gap-2">
        {venues.map((venue) => (
          <li
            key={venue}
            className="inline-flex items-center rounded-lg bg-paper-sunken px-2.5 py-1 text-[13px] font-medium text-ink-soft"
          >
            {venue}
          </li>
        ))}
      </ul>
    </div>
  );
}
