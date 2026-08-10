import clsx from 'clsx';

// Small eyebrow-style label that groups a stretch of the Reports page into
// a named section ("Pulse", "Needs attention", "Breakdown"...) — gives a
// long analytics page real information architecture instead of reading as
// one undifferentiated stack of cards.
export default function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-route-500">
            <span className="h-1.5 w-1.5 rounded-full bg-route-500" />
            {eyebrow}
          </p>
        )}
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
