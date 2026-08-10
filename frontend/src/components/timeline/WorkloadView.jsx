import { useMemo } from 'react';
import clsx from 'clsx';
import { Users, TriangleAlert } from 'lucide-react';
import EmptyState from '../ui/EmptyState.jsx';
import Avatar from '../ui/Avatar.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import { ZOOM_LEVELS, buildTicks, computeWindow, diffDays, effectiveRange, formatShort, addDays } from '../../utils/timelineScale';

const ROW_HEIGHT = 52;

// How many concurrent tasks counts as what, in plain terms — this is a
// simplified stand-in for real capacity (hours/story points aren't in
// the data model), but "3 things due the same week" is already a useful
// enough signal to plan around. Fills are built from brand hues at low
// opacity rather than fixed pastel swatches, so the heatmap holds up on
// a dark surface exactly as well as a light one.
function loadMeta(count) {
  if (count === 0) return { cell: 'bg-ink-muted/[0.05]', label: 'Free', text: 'text-ink-muted' };
  if (count === 1) return { cell: 'bg-route-500/20 ring-1 ring-inset ring-route-500/25', label: '1 task', text: 'text-route-700' };
  if (count === 2) return { cell: 'bg-accent-400/35 ring-1 ring-inset ring-accent-400/30', label: '2 tasks', text: 'text-accent-800' };
  return { cell: 'bg-danger-500/70 ring-1 ring-inset ring-danger-500/40', label: `${count} tasks · overloaded`, text: 'text-white' };
}

const LEGEND = [
  { swatch: 'bg-ink-muted/20', label: 'Free' },
  { swatch: 'bg-route-500/60', label: '1 task' },
  { swatch: 'bg-accent-400/80', label: '2 tasks' },
  { swatch: 'bg-danger-500', label: '3+ overloaded' },
];

// Per-person capacity heatmap: one row per assignee, one column per tick
// (day/week/month depending on zoom, same buckets as the Task Gantt so
// switching tabs doesn't reorient you), each cell shaded by how many
// tasks that person has running concurrently in that bucket. Rebuilt as
// its own card — icon-chip summary strip (same TiltCard language as the
// dashboard's stat cards), per-person load bars, and a heatmap whose
// cells actually lift and pop on hover — so it reads as a real planning
// tool rather than a debug grid.
export default function WorkloadView({ tasks = [], zoom }) {
  const { pxPerDay, tickUnit } = ZOOM_LEVELS[zoom];

  const assigned = useMemo(() => tasks.filter((t) => t.assignee && t.dueDate), [tasks]);

  const people = useMemo(() => {
    const byId = new Map();
    assigned.forEach((t) => {
      if (!byId.has(t.assignee.id)) byId.set(t.assignee.id, { user: t.assignee, tasks: [] });
      byId.get(t.assignee.id).tasks.push(t);
    });
    return [...byId.values()].sort((a, b) => b.tasks.length - a.tasks.length);
  }, [assigned]);

  const { rangeStart, rangeEnd } = useMemo(() => computeWindow(assigned), [assigned]);
  const totalDays = Math.max(diffDays(rangeEnd, rangeStart), 1);
  const totalWidth = totalDays * pxPerDay;
  const ticks = useMemo(() => buildTicks(rangeStart, rangeEnd, tickUnit), [rangeStart, rangeEnd, tickUnit]);
  const dateToX = (date) => diffDays(date, rangeStart) * pxPerDay;

  const now = new Date();
  const todayX = now >= rangeStart && now <= rangeEnd ? dateToX(now) : null;

  // End of each tick's bucket = the next tick's start (or rangeEnd for the last one).
  const bucketEnd = (i) => (i + 1 < ticks.length ? ticks[i + 1] : addDays(rangeEnd, 1));

  // Peak concurrent load per person, over the whole visible window — feeds
  // both the mini load bar in the label column and the overloaded count
  // in the summary strip.
  const peaks = useMemo(() => {
    const map = new Map();
    people.forEach(({ user, tasks: personTasks }) => {
      let peak = 0;
      ticks.forEach((tick, i) => {
        const end = bucketEnd(i);
        const count = personTasks.filter((t) => {
          const { start, end: due } = effectiveRange(t);
          return start < end && due >= tick;
        }).length;
        if (count > peak) peak = count;
      });
      map.set(user.id, peak);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, ticks]);

  const maxPeak = Math.max(1, ...peaks.values());
  const overloadedCount = [...peaks.values()].filter((p) => p >= 3).length;
  const avgLoad = people.length ? (assigned.length / people.length).toFixed(1) : 0;

  if (people.length === 0) {
    return (
      <EmptyState
        title="Nothing to show yet"
        description="Assign tasks to people with due dates and their workload will show up here as a heatmap."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip — the three numbers a planner actually opens this
          tab to check, before scanning the grid itself. Same TiltCard +
          icon-chip language as the dashboard's stat cards. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TiltCard maxTilt={4} className="rounded-lg">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-gradient-to-br from-teal-400/[0.08] via-surface to-surface px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400 text-white shadow-md shadow-teal-400/30">
              <Users className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-none text-ink">{people.length}</p>
              <p className="mt-1 truncate text-xs text-ink-muted">people tracked</p>
            </div>
          </div>
        </TiltCard>
        <TiltCard maxTilt={4} className="rounded-lg">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-gradient-to-br from-route-500/[0.08] via-surface to-surface px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-route-500 text-white shadow-md shadow-route-500/30">
              <span className="font-display text-sm font-bold">Ø</span>
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-none text-ink">{avgLoad}</p>
              <p className="mt-1 truncate text-xs text-ink-muted">avg tasks / person</p>
            </div>
          </div>
        </TiltCard>
        <TiltCard maxTilt={4} className="rounded-lg">
          <div
            className={clsx(
              'flex items-center gap-3 rounded-lg border px-4 py-3',
              overloadedCount > 0
                ? 'border-danger-500/20 bg-gradient-to-br from-danger-500/[0.08] via-surface to-surface'
                : 'border-line bg-gradient-to-br from-success-400/[0.08] via-surface to-surface'
            )}
          >
            <span
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-md',
                overloadedCount > 0 ? 'bg-danger-500 shadow-danger-500/30' : 'bg-success-400 shadow-success-400/30'
              )}
            >
              <TriangleAlert className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-none text-ink">{overloadedCount}</p>
              <p className="mt-1 truncate text-xs text-ink-muted">{overloadedCount === 1 ? 'person' : 'people'} overloaded</p>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/50 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-4 text-ink-muted">
            <span className="hidden font-medium text-ink sm:inline">Concurrent load, sorted by busiest</span>
            {LEGEND.map(({ swatch, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={clsx('h-2.5 w-2.5 rounded-[3px]', swatch)} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex">
          {/* Fixed label column */}
          <div className="shrink-0 border-r border-line" style={{ width: 232 }}>
            <div
              className="flex items-center border-b border-line px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
              style={{ height: 36 }}
            >
              Person
            </div>
            {people.map(({ user, tasks: personTasks }, i) => {
              const peak = peaks.get(user.id) || 0;
              const barPct = Math.round((peak / maxPeak) * 100);
              const barColor = peak >= 3 ? 'bg-danger-500' : peak === 2 ? 'bg-accent-400' : 'bg-route-500';
              return (
                <div
                  key={user.id}
                  className="group flex flex-col justify-center gap-1.5 border-b border-line/60 px-3 transition-colors duration-150 hover:bg-paper/60 animate-[fade-in-up_0.4s_ease-out_both]"
                  style={{ height: ROW_HEIGHT, animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                      <p className="text-[11px] text-ink-muted">
                        {personTasks.length} task{personTasks.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    {peak >= 3 && (
                      <span className="shrink-0 rounded-full bg-danger-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-danger-600">
                        Peak {peak}
                      </span>
                    )}
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-line/60">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-700 ease-out', barColor)}
                      style={{ width: `${Math.max(barPct, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable heatmap */}
          <div className="relative flex-1 overflow-x-auto">
            <div style={{ width: totalWidth, minWidth: '100%' }}>
              {/* Ruler */}
              <div className="relative border-b border-line" style={{ height: 36 }}>
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute top-0 flex h-full items-center border-l border-dashed border-line/70 pl-1.5"
                    style={{ left: dateToX(tick) }}
                  >
                    <span className="whitespace-nowrap font-mono text-[10px] font-medium tracking-tight text-ink-muted">
                      {tickUnit === 'month'
                        ? tick.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
                        : formatShort(tick)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: people.length * ROW_HEIGHT }}>
                {/* Today marker, same treatment as the Gantt view */}
                {todayX != null && (
                  <div className="absolute top-0 z-10" style={{ left: todayX, height: people.length * ROW_HEIGHT }}>
                    <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 animate-pulse bg-gradient-to-r from-transparent via-accent-400/25 to-transparent blur-[2px]" />
                    <div className="absolute inset-y-0 left-0 w-px bg-accent-500/80" />
                  </div>
                )}

                {people.map(({ user, tasks: personTasks }, rowIdx) => (
                  <div
                    key={user.id}
                    className="group absolute left-0 right-0 border-b border-line/60 transition-colors duration-150 hover:bg-paper/40"
                    style={{ top: rowIdx * ROW_HEIGHT, height: ROW_HEIGHT }}
                  >
                    {ticks.map((tick, i) => {
                      const end = bucketEnd(i);
                      const width = Math.max(diffDays(end, tick), 1) * pxPerDay;
                      const active = personTasks.filter((t) => {
                        const { start, end: due } = effectiveRange(t);
                        return start < end && due >= tick;
                      });
                      const meta = loadMeta(active.length);
                      return (
                        <div
                          key={i}
                          className={clsx(
                            'absolute top-2 flex cursor-default items-center justify-center rounded-md transition-all duration-150 ease-out hover:z-20 hover:scale-[1.06] hover:shadow-pop',
                            meta.cell
                          )}
                          style={{ left: dateToX(tick) + 2, width: width - 4, height: ROW_HEIGHT - 16 }}
                          title={
                            active.length === 0
                              ? `${user.name} · free`
                              : `${user.name} · ${meta.label}\n${active.map((t) => `• ${t.title}`).join('\n')}`
                          }
                        >
                          {active.length > 0 && (
                            <span className={clsx('font-mono text-[10px] font-semibold', meta.text)}>{active.length}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
