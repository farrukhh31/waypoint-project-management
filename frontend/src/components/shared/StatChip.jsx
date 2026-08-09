import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// Small icon + value + label chip used across detail pages (project details,
// task details) for at-a-glance metadata. Kept in one place so both pages
// stay visually consistent. Pass onClick to make it an interactive
// drill-in (e.g. "Team size" opening the team chart) — it renders as a
// <button> with a chevron hint instead of a static <div>.
export default function StatChip({ icon: Icon, label, value, tone = 'bg-route-100 text-route-600', onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center gap-2.5 rounded-lg border border-line/70 bg-surface/70 px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:shadow-card',
        onClick && 'cursor-pointer hover:bg-route-50/40'
      )}
    >
      <span
        className={clsx(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-110',
          tone
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{value}</p>
        <p className="truncate text-[11px] text-ink-muted">{label}</p>
      </div>
      {onClick && (
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-route-600 group-hover:opacity-100" />
      )}
    </Tag>
  );
}
