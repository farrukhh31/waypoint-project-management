import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Diamond, CheckCircle2, Circle, ArrowRight, Layers, CalendarClock } from 'lucide-react';
import clsx from 'clsx';
import EmptyState from '../ui/EmptyState.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import Avatar from '../ui/Avatar.jsx';
import { computeWindow, diffDays, formatShort, formatMonthYear, startOfDay } from '../../utils/timelineScale';

// Status a milestone is in *right now* — the thing the old version never
// told you. "blocked" means a task milestone has unfinished prerequisite
// tasks (via TaskDependency); everything else is a straight date check.
const STATUS_META = {
  done: {
    label: 'Completed',
    dot: 'bg-success-400',
    chip: 'bg-success-50 text-success-600',
    bar: 'bg-success-400',
    glow: '0 10px 28px -8px rgba(60,135,104,0.35)',
    ring: 'text-success-500',
  },
  blocked: {
    label: 'Blocked',
    dot: 'bg-danger-400',
    chip: 'bg-danger-50 text-danger-600',
    bar: 'bg-danger-400',
    glow: '0 10px 28px -8px rgba(193,72,61,0.4)',
    ring: 'text-danger-500',
  },
  overdue: {
    label: 'Overdue',
    dot: 'bg-danger-400',
    chip: 'bg-danger-50 text-danger-600',
    bar: 'bg-danger-400',
    glow: '0 10px 28px -8px rgba(193,72,61,0.4)',
    ring: 'text-danger-500',
  },
  soon: {
    label: 'Due soon',
    dot: 'bg-accent-400',
    chip: 'bg-accent-100 text-accent-700',
    bar: 'bg-accent-400',
    glow: '0 10px 28px -8px rgba(226,163,59,0.4)',
    ring: 'text-accent-600',
  },
  upcoming: {
    label: 'On track',
    dot: 'bg-route-400',
    chip: 'bg-route-100 text-route-700',
    bar: 'bg-route-400',
    glow: '0 10px 28px -8px rgba(76,135,181,0.35)',
    ring: 'text-route-500',
  },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Completed' },
];

function deriveStatus(item, now) {
  if (item.done) return 'done';
  if (item.kind === 'task' && item.incompleteBlockers?.length) return 'blocked';
  if (startOfDay(item.date) < startOfDay(now)) return 'overdue';
  if (diffDays(item.date, now) <= 7) return 'soon';
  return 'upcoming';
}

function countdownLabel(date, now) {
  const days = diffDays(date, now);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days}d`;
  if (days === -1) return 'Yesterday';
  return `${Math.abs(days)}d overdue`;
}

// Milestones = project end dates + tasks explicitly flagged isMilestone.
// Each is resolved against the full task list to work out whether it's
// blocked (task milestones, via TaskDependency) or how far along its
// project's task list is (project deadlines) — not just where it sits
// on the calendar.
// `compact` is for embedding this view inside a fixed-size container (the
// dashboard's TimelineWidget) where switching to Milestones must NOT grow
// the card and push the rest of the dashboard grid around. It trims the
// chrome (filter bar, group-by toggle, axis) and caps the list in its own
// scroll area instead of letting it grow with the content.
export default function MilestonesView({ tasks = [], projects = [], basePath = '/admin/tasks', projectsBasePath = '/admin/projects', compact = false }) {
  const [filter, setFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('date'); // 'date' | 'project'
  const now = new Date();

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const items = useMemo(() => {
    const fromTasks = tasks
      .filter((t) => t.isMilestone && t.dueDate)
      .map((t) => {
        const blockers = (t.dependsOn || []).map((dep) => tasksById.get(dep.id)).filter(Boolean);
        const incompleteBlockers = blockers.filter((b) => b.status !== 'COMPLETED');
        return {
          id: t.id,
          kind: 'task',
          title: t.title,
          date: new Date(t.dueDate),
          project: t.project,
          assignee: t.assignee,
          done: t.status === 'COMPLETED',
          blockers,
          incompleteBlockers,
        };
      });

    const fromProjects = projects
      .filter((p) => p.endDate)
      .map((p) => {
        const projectTasks = tasks.filter((t) => t.project?.id === p.id);
        const completedCount = projectTasks.filter((t) => t.status === 'COMPLETED').length;
        return {
          id: p.id,
          kind: 'project',
          title: `${p.name} — deadline`,
          date: new Date(p.endDate),
          project: p,
          done: p.status === 'COMPLETED',
          taskTotal: projectTasks.length,
          taskDone: completedCount,
        };
      });

    return [...fromTasks, ...fromProjects].sort((a, b) => a.date - b.date);
  }, [tasks, projects, tasksById]);

  const withStatus = useMemo(() => items.map((item) => ({ ...item, status: deriveStatus(item, now) })), [items]);

  const counts = useMemo(
    () => ({
      all: withStatus.length,
      blocked: withStatus.filter((i) => i.status === 'blocked').length,
      upcoming: withStatus.filter((i) => i.status === 'upcoming' || i.status === 'soon' || i.status === 'overdue').length,
      done: withStatus.filter((i) => i.status === 'done').length,
    }),
    [withStatus]
  );

  const filtered = withStatus.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['upcoming', 'soon', 'overdue'].includes(item.status);
    return item.status === filter;
  });

  const nextUp = withStatus.find((i) => i.status !== 'done');

  if (items.length === 0) {
    return (
      <EmptyState
        title="No milestones yet"
        description="Mark a task as a milestone, or set a project deadline, and it'll show up here."
      />
    );
  }

  const { rangeStart, rangeEnd } = computeWindow(items.map((i) => ({ dueDate: i.date })));
  const totalSpan = Math.max(diffDays(rangeEnd, rangeStart), 1);
  const todayPct = now >= rangeStart && now <= rangeEnd ? (diffDays(now, rangeStart) / totalSpan) * 100 : null;

  // Group the filtered list either by calendar month (default) or by
  // project, each with its own section label.
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const key = groupBy === 'project' ? item.project?.name || 'Unassigned' : formatMonthYear(item.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()];
  }, [filtered, groupBy]);

  return (
    <div className="flex flex-col gap-5">
      {/* Stat + filter bar — dropped in compact mode so the widget's fixed
          shell doesn't gain an extra row of chrome. */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'border-ink bg-ink text-white shadow-sm'
                    : 'border-line bg-surface text-ink-muted hover:border-ink-muted/40 hover:text-ink'
                )}
              >
                {f.label}
                <span
                  className={clsx(
                    'rounded-full px-1.5 py-px font-mono text-[10px]',
                    filter === f.key ? 'bg-white/15 text-white' : 'bg-paper text-ink-muted'
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5 text-xs">
            {[
              { key: 'date', label: 'By date' },
              { key: 'project', label: 'By project' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setGroupBy(opt.key)}
                className={clsx(
                  'rounded-md px-2.5 py-1 font-medium transition-colors',
                  groupBy === opt.key ? 'bg-route-500 text-white shadow-sm' : 'text-ink-muted hover:bg-paper hover:text-ink'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spotlight: the next thing that isn't done yet */}
      {nextUp && (
        <NextUpCard item={nextUp} now={now} basePath={basePath} projectsBasePath={projectsBasePath} />
      )}

      {/* Axis — decorative, and not worth the width in a narrow widget */}
      {!compact && (
        <div className="route-line relative mx-2 h-px">
          {todayPct != null && (
            <div className="absolute -top-2 z-10" style={{ left: `${todayPct}%` }} title="Today">
              <div className="absolute -left-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-accent-300/40 to-transparent blur-[3px]" />
              <div className="h-4 w-px bg-accent-500/80" />
            </div>
          )}
          {items.map((item) => {
            const pct = (diffDays(item.date, rangeStart) / totalSpan) * 100;
            const meta = STATUS_META[deriveStatus(item, now)];
            return (
              <div
                key={`${item.kind}-${item.id}`}
                className="group absolute -top-1.5 flex flex-col items-center"
                style={{ left: `${pct}%` }}
                title={`${item.title} · ${formatShort(item.date)}`}
              >
                {item.kind === 'project' ? (
                  <Flag className={clsx('h-3 w-3 transition-transform group-hover:scale-125', meta.ring)} />
                ) : (
                  <Diamond className={clsx('h-2.5 w-2.5 fill-current transition-transform group-hover:scale-125', meta.ring)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Groups — in compact mode this sits in its own capped, scrollable
          area so picking the Milestones tab never changes the widget's
          overall height (which would otherwise shove the rest of the
          dashboard grid down every time someone switches tabs). */}
      <div className={compact ? 'max-h-[280px] overflow-y-auto pr-1' : undefined}>
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-paper/50 px-4 py-8 text-center text-sm text-ink-muted">
            Nothing in this view. Try a different filter.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(([label, groupItems]) => (
              <div key={label} className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
                <div className={clsx('grid grid-cols-1 gap-3', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
                  {groupItems.map((item) => (
                    <MilestoneCard key={`${item.kind}-${item.id}-card`} item={item} now={now} basePath={basePath} projectsBasePath={projectsBasePath} compact={compact} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NextUpCard({ item, now, basePath, projectsBasePath = '/admin/projects' }) {
  const meta = STATUS_META[item.status];
  const href = item.kind === 'task' ? `${basePath}/${item.id}` : `${projectsBasePath}/${item.id}`;

  return (
    <Link
      to={href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-line bg-gradient-to-br from-surface to-paper p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.chip)}>
          <CalendarClock className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Up next</p>
          <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
          {item.kind === 'task' && item.project?.name && (
            <p className="truncate text-xs text-ink-muted">{item.project.name}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:shrink-0">
        {item.kind === 'task' && item.blockers.length > 0 && (
          <div className="hidden items-center gap-1.5 text-xs text-ink-muted md:flex">
            <Layers className="h-3.5 w-3.5" />
            {item.incompleteBlockers.length === 0
              ? 'Ready to go'
              : `Waiting on ${item.incompleteBlockers.length} task${item.incompleteBlockers.length > 1 ? 's' : ''}`}
          </div>
        )}
        <span className={clsx('rounded-full px-2.5 py-1 font-mono text-xs font-semibold', meta.chip)}>
          {countdownLabel(item.date, now)}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-route-600" />
      </div>
    </Link>
  );
}

function MilestoneCard({ item, now, basePath, projectsBasePath = '/admin/projects', compact = false }) {
  const meta = STATUS_META[item.status];
  const href = item.kind === 'task' ? `${basePath}/${item.id}` : `${projectsBasePath}/${item.id}`;
  // In compact mode, skip the blockers checklist and progress bar — they're
  // what made cards balloon to very different heights and disturb the
  // dashboard layout. The full detail is one click away on the task/project.
  const hasBlockers = !compact && item.kind === 'task' && item.blockers.length > 0;
  const hasProjectProgress = !compact && item.kind === 'project' && item.taskTotal > 0;

  return (
    <TiltCard maxTilt={4} className="h-full rounded-lg">
      <Link
        to={href}
        className="group relative flex h-full flex-col gap-2.5 overflow-hidden rounded-lg border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-1"
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = meta.glow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <span className={clsx('absolute inset-x-0 top-0 h-[3px]', meta.bar)} />

        <div className="flex items-center justify-between gap-2">
          <span
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              item.kind === 'project' ? 'bg-route-100 text-route-600' : 'bg-accent-100 text-accent-600'
            )}
          >
            {item.kind === 'project' ? <Flag className="h-3.5 w-3.5" /> : <Diamond className="h-3.5 w-3.5" />}
          </span>
          <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.chip)}>
            {meta.label}
          </span>
        </div>

        <div>
          <p className="line-clamp-2 text-sm font-medium text-ink">{item.title}</p>
          {item.kind === 'task' && item.project?.name && (
            <p className="truncate text-xs text-ink-muted">{item.project.name}</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between text-xs">
          <span className="font-mono tracking-tight text-ink-muted">{formatShort(item.date)}</span>
          <span className={clsx('font-mono font-semibold', meta.ring)}>{countdownLabel(item.date, now)}</span>
        </div>

        {/* Blockers checklist — the whole reason this task can't move yet */}
        {hasBlockers && (
          <div className="space-y-1 border-t border-line pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              {item.incompleteBlockers.length > 0
                ? `Waiting on ${item.incompleteBlockers.length} of ${item.blockers.length} task${item.blockers.length > 1 ? 's' : ''}`
                : 'Prerequisites complete'}
            </p>
            {item.blockers.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center gap-1.5 text-xs">
                {b.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-success-500" />
                ) : (
                  <Circle className="h-3 w-3 shrink-0 text-ink-muted/60" />
                )}
                <span className={clsx('truncate', b.status === 'COMPLETED' ? 'text-ink-muted line-through' : 'text-ink-soft')}>
                  {b.title}
                </span>
              </div>
            ))}
            {item.blockers.length > 3 && (
              <p className="text-[10px] text-ink-muted">+{item.blockers.length - 3} more</p>
            )}
          </div>
        )}

        {/* Task-completion progress toward a project deadline */}
        {hasProjectProgress && (
          <div className="border-t border-line pt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-ink-muted">
              <span>{item.taskDone}/{item.taskTotal} tasks done</span>
              <span className="font-mono">{Math.round((item.taskDone / item.taskTotal) * 100)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-paper">
              <div
                className={clsx('h-full rounded-full transition-all', meta.bar)}
                style={{ width: `${Math.round((item.taskDone / item.taskTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {item.kind === 'task' && item.assignee && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <Avatar name={item.assignee.name} size="sm" className="h-5 w-5 text-[9px]" />
            <span className="truncate text-[11px] text-ink-muted">{item.assignee.name}</span>
          </div>
        )}

        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-medium text-route-600 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Open
          <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    </TiltCard>
  );
}
