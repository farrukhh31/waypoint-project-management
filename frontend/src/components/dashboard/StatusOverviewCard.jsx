import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import Card from '../ui/Card.jsx';
import TiltCard from '../ui/TiltCard.jsx';

const WASH = {
  route: 'bg-gradient-to-br from-route-500/[0.09] via-surface to-surface',
  accent: 'bg-gradient-to-br from-accent-400/[0.09] via-surface to-surface',
};
const CHIP = {
  route: 'bg-route-500 text-white shadow-route-500/30',
  accent: 'bg-accent-400 text-white shadow-accent-400/30',
};

// The two headline "what's on my plate" numbers (Projects / Tasks) get
// their own wider, richer card instead of a plain StatCard tile: the same
// real status-breakdown data already fetched for the dashboard's
// StatusBreakdown widgets (`data.projectsByStatus` / `data.tasksByStatus`)
// drives a segmented composition bar right under the headline count, so
// the count and its makeup are both real and both visible without a
// second glance elsewhere on the page.
export default function StatusOverviewCard({
  label,
  subtitle,
  icon: Icon,
  accent = 'route',
  total = 0,
  data = [],
  meta,
  tone,
  order,
  to,
}) {
  const counts = Object.fromEntries((data || []).map((d) => [d.status, d.count]));
  const segments = order
    .filter((key) => (counts[key] || 0) > 0)
    .map((key) => ({ key, count: counts[key] || 0, pct: total > 0 ? (counts[key] / total) * 100 : 0 }));

  const card = (
    <Card
      className={clsx(
        'group relative flex h-full flex-col justify-between gap-4 overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-pop',
        WASH[accent] || WASH.route
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{total}</p>
        </div>
        {Icon && (
          <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg', CHIP[accent] || CHIP.route)}>
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-2.5">
        {total > 0 ? (
          <>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-paper">
              {segments.map((s) => (
                <div
                  key={s.key}
                  className={clsx('h-full transition-all duration-700 ease-out', tone[s.key]?.bar)}
                  style={{ width: `${s.pct}%` }}
                  title={`${meta[s.key]?.label}: ${s.count}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
              {segments.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className={clsx('h-1.5 w-1.5 rounded-full', tone[s.key]?.bar)} />
                  {meta[s.key]?.label}
                  <span className="font-semibold text-ink-soft">{s.count}</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-muted">{subtitle || 'Nothing here yet'}</p>
        )}
      </div>

      {to && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-muted opacity-0 shadow-card transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-route-600">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      )}
    </Card>
  );

  const content = to ? (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );

  return (
    <TiltCard maxTilt={4} className="block h-full rounded-lg">
      {content}
    </TiltCard>
  );
}
