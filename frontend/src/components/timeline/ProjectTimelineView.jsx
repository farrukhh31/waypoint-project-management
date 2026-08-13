import { Link } from 'react-router-dom';
import { Route as RouteIcon, Clock } from 'lucide-react';
import EmptyState from '../ui/EmptyState.jsx';
import Avatar from '../ui/Avatar.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import { PROJECT_STATUS_META } from '../../config/statuses';
import { formatDate } from '../../utils/formatDate';
import { computeWindow, diffDays } from '../../utils/timelineScale';

const PRIORITY_BAR = {
  LOW: 'bg-ink-muted/40',
  MEDIUM: 'bg-route-500',
  HIGH: 'bg-accent-400',
  URGENT: 'bg-danger-400',
};

// Every project as a journey on one shared road — extended from the
// dashboard's original single-lane "active projects only" widget to
// show every project regardless of status, each on its own tilting
// card so the whole page has some depth to it.
export default function ProjectTimelineView({ projects = [], basePath = '/admin/projects', compact = false, className = '' }) {
  const withDates = projects.filter((p) => p.startDate && p.endDate);

  if (withDates.length === 0) {
    return (
      <EmptyState
        title="No projects on the road yet"
        description="Projects with a start and end date will appear here as a timeline."
      />
    );
  }

  const { rangeStart, rangeEnd } = computeWindow(
    withDates.map((p) => ({ startDate: p.startDate, dueDate: p.endDate }))
  );
  const totalSpan = diffDays(rangeEnd, rangeStart);
  const now = new Date();
  const todayPct = now >= rangeStart && now <= rangeEnd ? (diffDays(now, rangeStart) / totalSpan) * 100 : null;

  const list = compact ? withDates.slice(0, 6) : withDates;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <div className="flex items-center gap-3">
          {Object.entries(PRIORITY_BAR).map(([priority, cls]) => (
            <span key={priority} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />
              {priority[0] + priority.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
        <span className="font-mono">
          {formatDate(rangeStart)} — {formatDate(rangeEnd)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {list.map((project, i) => {
          const start = new Date(project.startDate);
          const end = new Date(project.endDate);
          const left = (diffDays(start, rangeStart) / totalSpan) * 100;
          const width = Math.max((diffDays(end, start) / totalSpan) * 100, 3);
          const statusMeta = PROJECT_STATUS_META[project.status];
          const progress = project.progress;
          const donePct = progress?.total ? Math.round((progress.completed / progress.total) * 100) : null;
          const elapsedPct = Math.min(100, Math.max(0, (diffDays(now, start) / Math.max(diffDays(end, start), 1)) * 100));

          return (
            <TiltCard
              key={project.id}
              maxTilt={3}
              className={`rounded-lg ${compact ? 'animate-[fade-in-up_0.5s_ease-out_both]' : ''}`}
              style={compact ? { animationDelay: `${i * 70}ms` } : undefined}
            >
              <Link
                to={`${basePath}/${project.id}`}
                className="group flex h-full flex-col justify-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink group-hover:text-route-600">
                      {project.name}
                    </span>
                    {statusMeta && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                    {project.manager && <Avatar name={project.manager.name} size="sm" />}
                    <span className="hidden font-mono tracking-tight sm:inline">
                      {formatDate(project.startDate)} – {formatDate(project.endDate)}
                    </span>
                  </div>
                </div>

                <div className="relative h-9 w-full rounded-md bg-paper">
                  {todayPct != null && (
                    <div
                      className="absolute -top-1 z-10 h-11"
                      style={{ left: `${todayPct}%` }}
                      title="Today"
                    >
                      <div className="absolute inset-y-0 left-1/2 w-2.5 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-400/30 to-transparent blur-[2px]" />
                      <div className="absolute inset-y-0 left-0 w-px bg-accent-500/80" />
                    </div>
                  )}
                  <div
                    className="absolute top-0 flex h-9 items-center gap-1.5 overflow-hidden rounded-md border border-white/[0.06] bg-gradient-to-b from-ink-soft to-ink pl-0 pr-2.5 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_-6px_rgba(18,23,43,0.35)]"
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: 92 }}
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
                    <span className={`h-full w-1 shrink-0 rounded-l-md ${PRIORITY_BAR[project.priority] || 'bg-route-400'}`} />
                    <RouteIcon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    <span className="truncate text-xs font-medium text-white">{project.name}</span>
                    <span className="ml-auto hidden shrink-0 items-center gap-1 whitespace-nowrap font-mono text-[10px] tracking-tight text-ink-muted/90 sm:flex">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.startDate)} – {formatDate(project.endDate)}
                    </span>
                  </div>
                </div>

                {/* Task-progress footer — fills the card with the same real
                    per-project counts Reports/AtRiskProjects use, instead of
                    leaving the row as just a thin route bar on empty card. */}
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-route-400 to-route-500 transition-all duration-700 ease-out"
                      style={{ width: `${donePct ?? elapsedPct}%` }}
                    />
                  </div>
                  {progress?.total ? (
                    <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-muted">
                      <span className="font-semibold text-ink-soft">{progress.completed}</span>/{progress.total} tasks done
                      {progress.overdue > 0 && <span className="ml-1.5 text-danger-600">· {progress.overdue} overdue</span>}
                    </span>
                  ) : (
                    <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-muted">No tasks yet</span>
                  )}
                </div>
              </Link>
            </TiltCard>
          );
        })}
      </div>

      {compact && withDates.length > 6 && (
        <p className="pt-1 text-center text-xs text-ink-muted">+{withDates.length - 6} more on the full timeline</p>
      )}
    </div>
  );
}
