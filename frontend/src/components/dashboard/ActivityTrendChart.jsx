import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useActivityTrend } from '../../hooks/useActivityTrend';
import { formatDate } from '../../utils/formatDate';

const RANGES = [
  { value: 7, label: '7D' },
  { value: 14, label: '14D' },
  { value: 30, label: '30D' },
];

const SERIES = [
  { key: 'project', label: 'Projects', bar: 'bg-route-500', dot: 'bg-route-500', text: 'text-route-600' },
  { key: 'task', label: 'Tasks', bar: 'bg-accent-400', dot: 'bg-accent-400', text: 'text-accent-600' },
  { key: 'team', label: 'Team', bar: 'bg-success-400', dot: 'bg-success-400', text: 'text-success-600' },
];

const BAR_MAX_HEIGHT = 180; // px — every segment height is computed as an exact fraction of this against maxTotal, no smoothing/interpolation

function ChartSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 py-2">
      <div className="flex h-44 items-end gap-1.5">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-line"
            style={{ height: `${30 + ((i * 37) % 60)}%` }}
          />
        ))}
      </div>
      <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
    </div>
  );
}

// A plain, exact stacked bar chart — every bar segment's height is a direct
// pixel fraction of the real day count against the period's max, with no
// curve fitting or point-to-point smoothing in between. Each bar is one
// real day's ActivityLog counts, so what you see is exactly what's in the
// data — nothing implied or interpolated between days. Fetches its own
// data from GET /api/dashboard/activity (see useActivityTrend), so
// switching the range toggle re-queries the real table.
export default function ActivityTrendChart() {
  const [range, setRange] = useState(7);
  const [hovered, setHovered] = useState(null);
  const { data, loading } = useActivityTrend(range);
  const days = data?.activityByDay ?? [];
  const totals = data?.totals ?? { project: 0, task: 0, team: 0, total: 0 };

  const maxTotal = useMemo(() => Math.max(1, ...days.map((d) => d.total)), [days]);
  const hasActivity = days.some((d) => d.total > 0);
  const showWeekday = range <= 7;
  const tickEvery = range > 14 ? Math.ceil(days.length / 8) : range > 7 ? 2 : 1;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="flex-wrap gap-y-3 bg-gradient-to-r from-route-50/60 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Activity trend</h3>
          <p className="text-xs text-ink-muted">Last {range} days, live from the activity log — one bar per real day</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                  range === r.value ? 'bg-route-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper hover:text-ink'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-route-100 text-route-600">
            <TrendingUp className="h-4 w-4" />
          </span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col">
        {loading ? (
          <ChartSkeleton />
        ) : !hasActivity ? (
          <EmptyState
            title="No recent activity"
            description={`Project and task activity from the last ${range} days will chart here.`}
          />
        ) : (
          <div className="flex flex-1 flex-col">
            {/* Legend with real period totals — sourced from the exact same query as the bars */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {SERIES.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs">
                  <span className={clsx('h-2 w-2 rounded-full', s.dot)} />
                  <span className="text-ink-muted">{s.label}</span>
                  <span className={clsx('font-semibold', s.text)}>{totals[s.key]}</span>
                </span>
              ))}
              <span className="ml-auto text-xs text-ink-muted">
                <span className="font-display font-semibold text-ink">{totals.total}</span> total
              </span>
            </div>

            <div className="relative flex-1">
              {/* Gridlines at exact 25/50/75% of the period max, for scale reference */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: BAR_MAX_HEIGHT }}>
                {[0, 0.25, 0.5, 0.75].map((f) => (
                  <div key={f} className="border-t border-dashed border-line" />
                ))}
              </div>

              <div className="flex items-end gap-1 sm:gap-1.5" style={{ height: BAR_MAX_HEIGHT }}>
                {days.map((day, i) => {
                  const isHovered = hovered === i;
                  return (
                    <div
                      key={day.date}
                      className="group/bar relative flex h-full flex-1 cursor-pointer flex-col-reverse items-stretch"
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                    >
                      {day.total === 0 ? (
                        <div className="h-[3px] w-full rounded-full bg-line" />
                      ) : (
                        SERIES.map((s) => {
                          const value = day[s.key];
                          if (value <= 0) return null;
                          const heightPx = Math.max(Math.round((value / maxTotal) * BAR_MAX_HEIGHT), 3);
                          return (
                            <div
                              key={s.key}
                              className={clsx(
                                'w-full transition-all duration-300 ease-out first:rounded-b-sm last:rounded-t-sm',
                                s.bar,
                                isHovered ? 'brightness-110' : ''
                              )}
                              style={{ height: heightPx }}
                              title={`${s.label}: ${value}`}
                            />
                          );
                        })
                      )}

                      {isHovered && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                          <p className="font-medium text-ink">{formatDate(day.date)}</p>
                          <p className="text-ink-muted">
                            {day.total} activit{day.total === 1 ? 'y' : 'ies'}
                          </p>
                          <div className="mt-1 flex gap-2 text-[11px]">
                            <span className="text-route-600">{day.project} proj</span>
                            <span className="text-accent-600">{day.task} task</span>
                            <span className="text-success-600">{day.team} team</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 flex gap-1 sm:gap-1.5">
              {days.map((d, i) => (
                <span
                  key={d.date}
                  className={clsx(
                    'flex-1 truncate text-center text-[10px] sm:text-[11px]',
                    i === hovered ? 'font-semibold text-route-600' : 'text-ink-muted',
                    i % tickEvery !== 0 && i !== days.length - 1 && 'opacity-0'
                  )}
                >
                  {showWeekday ? d.label : formatDate(d.date).replace(/, \d{4}$/, '')}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
