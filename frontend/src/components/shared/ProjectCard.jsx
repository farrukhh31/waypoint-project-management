import { Link } from 'react-router-dom';
import { CalendarDays, Crown, Flag, Pencil, Trash2, ListChecks, AlertTriangle, Flame } from 'lucide-react';
import clsx from 'clsx';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import AvatarStack from '../ui/AvatarStack.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import { PROJECT_STATUS_META, PRIORITY_META, PROJECT_STATUS_TONE } from '../../config/statuses';
import { formatDate, formatDueDate, timeElapsedPct, isDeadlineCritical } from '../../utils/formatDate';

// Per-status tone used for the card's accent bar, the timeline pin, and the
// quiet hover-wash — same "premium gradient wash" language StatCard uses on
// the dashboard, so a project card and a stat card read as one family.
const STATUS_TONE = PROJECT_STATUS_TONE;

const PRIORITY_FLAG = {
  LOW: 'text-ink-muted',
  MEDIUM: 'text-route-500',
  HIGH: 'text-accent-500',
  URGENT: 'text-danger-400',
};

// Where along the start->end date span "today" sits, clamped to [0, 100].
// Drives the little route pin that travels the timeline strip — the same
// "progress along a route" motif used everywhere else in the app (see
// utils/formatDate.js#timeElapsedPct).

export default function ProjectCard({ project, basePath, canManage = false, onEdit, onDelete, style }) {
  const tone = STATUS_TONE[project.status] || STATUS_TONE.PLANNED;
  const progress = project.progress ?? { total: 0, completed: 0 };
  const progressPct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const timePct = timeElapsedPct(project.startDate, project.endDate);
  const dueLabel = formatDueDate(project.endDate);
  const isOverdue = dueLabel.includes('overdue') && project.status !== 'COMPLETED' && project.status !== 'CANCELLED';
  const isDueSoon = (dueLabel === 'Due today' || dueLabel === 'Due tomorrow') && !isOverdue;
  const isCritical = isDeadlineCritical(project.endDate, project.status);

  function stop(e, fn) {
    e.preventDefault();
    e.stopPropagation();
    fn?.(project);
  }

  return (
    <TiltCard maxTilt={3} className="block h-full rounded-lg" style={style}>
      <Link to={`${basePath}/${project.id}`} className="group block h-full outline-none">
        <Card
          className={clsx(
            'card-sheen relative flex h-full flex-col overflow-hidden p-0 transition-all duration-300',
            'hover:-translate-y-1 hover:border-route-200 hover:shadow-pop',
            'focus-visible:-translate-y-1 focus-visible:border-route-200 focus-visible:shadow-pop',
            // Deadline inside the next 24 hours — same blink meetings get.
            isCritical && 'urgent-blink'
          )}
        >
          {/* Quiet gradient wash that blooms in on hover, tinted per status */}
          <div
            className={clsx(
              'pointer-events-none absolute inset-0 bg-gradient-to-br via-surface to-surface opacity-0 transition-opacity duration-300 group-hover:opacity-100',
              tone.wash
            )}
            aria-hidden="true"
          />

          {/* Status accent bar */}
          <div className={clsx('relative h-[3px] w-full shrink-0', tone.bar)} />

          {/* Admin quick actions — float in on hover, never steal the click */}
          {canManage && (
            <div className="absolute right-3 top-4 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => stop(e, onEdit)}
                aria-label={`Edit ${project.name}`}
                className="rounded-md bg-surface/90 p-1.5 text-ink-muted shadow-card backdrop-blur transition-colors hover:bg-route-50 hover:text-route-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => stop(e, onDelete)}
                aria-label={`Delete ${project.name}`}
                className="rounded-md bg-surface/90 p-1.5 text-ink-muted shadow-card backdrop-blur transition-colors hover:bg-danger-50 hover:text-danger-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="relative flex flex-1 flex-col gap-3.5 p-5">
            <div className={clsx('flex items-start justify-between gap-2', canManage && 'pr-14')}>
              <h3 className="font-display text-base font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-route-700">
                {project.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge meta={PROJECT_STATUS_META[project.status]} />
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full bg-ink-muted/10 px-2.5 py-0.5 text-xs font-medium text-ink-soft'
                )}
              >
                <Flag className={clsx('h-3 w-3', PRIORITY_FLAG[project.priority])} strokeWidth={2.5} />
                {PRIORITY_META[project.priority]?.label}
              </span>
              {progress.overdue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-600">
                  <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                  {progress.overdue} overdue
                </span>
              )}
              {isCritical && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                  <Flame className="h-3 w-3" strokeWidth={2.5} />
                  Due within 24h
                </span>
              )}
            </div>

            {project.description && (
              <p className="line-clamp-2 text-sm text-ink-muted">{project.description}</p>
            )}

            {/* Task-completion progress */}
            <div className="mt-auto flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  {progress.total > 0 ? `${progress.completed} of ${progress.total} tasks` : 'No tasks yet'}
                </span>
                {progress.total > 0 && <span className="font-medium text-ink-soft">{progressPct}%</span>}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={clsx('h-full rounded-full transition-[width] duration-700 ease-out', tone.bar)}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Route timeline: dotted line with a pin at "today" */}
            <div className="relative h-3" title={`${Math.round(timePct)}% of the timeline elapsed`}>
              <div className="route-line absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" />
              <div
                className={clsx(
                  'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface transition-all duration-500',
                  tone.bar
                )}
                style={{ left: `${timePct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span
                className={clsx(
                  'flex items-center gap-1.5 text-xs',
                  isOverdue ? 'font-medium text-danger-600' : isDueSoon ? 'font-medium text-accent-600' : 'text-ink-muted'
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {dueLabel === '—' ? formatDate(project.endDate) : dueLabel}
              </span>

              <div className="flex items-center gap-2">
                <AvatarStack people={project.members || []} max={3} />
                {project.manager && (
                  <span className="relative" title={`Managed by ${project.manager.name}`}>
                    <Avatar name={project.manager.name} size="sm" className="ring-2 ring-surface" />
                    <Crown className="absolute -right-1 -top-1.5 h-3 w-3 rounded-full bg-accent-400 p-[1px] text-white" strokeWidth={2.5} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </TiltCard>
  );
}
