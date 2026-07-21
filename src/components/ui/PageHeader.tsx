/**
 * Standard page title block: a small letterspaced eyebrow over a large serif
 * display heading.
 *
 * The heading is `font-normal` rather than medium/bold because Quattrocento
 * ships only 400 and 700 — asking for 500 or 600 would get a synthesised weight
 * that reads noticeably heavier and wider than the real thing.
 */
export default function PageHeader({
  eyebrow,
  title,
  meta,
}: {
  /** Breadcrumb-ish trail, e.g. `Directory · Staff`. */
  eyebrow: string;
  title: string;
  /** Optional supporting line under the title — counts, status, etc. */
  meta?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1.5">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="font-serif text-[28px] font-normal leading-[1.05] text-ink sm:text-[34px] lg:text-[40px]">
        {title}
      </h1>
      {meta && <p className="text-sm text-ink-muted">{meta}</p>}
    </header>
  );
}
