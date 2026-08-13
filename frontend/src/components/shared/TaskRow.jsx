import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Send, AlertTriangle, CalendarDays, Flame } from 'lucide-react';
import clsx from 'clsx';
import Badge from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import { TASK_STATUS_META, TASK_STATUS_TONE, PRIORITY_META } from '../../config/statuses';
import { formatDueDate, isDeadlineCritical } from '../../utils/formatDate';
import { ROLES } from '../../config/roles';

/**
 * @param {string} [viewerRole] - current user's role, used to tailor the
 *   REVIEW-status callout: a Project Manager sees "Needs your review" (this
 *   is their queue), a Team Member sees "Awaiting review" (their own
 *   submission), anyone else gets a neutral "In review".
 * @param {string} [viewerId] - current user's id, so the PM callout only
 *   fires for tasks in projects they actually manage (not just any REVIEW
 *   row that happens to render in a shared list).
 */
// Task lists commonly render dozens of these — memoized so a parent-level
// state change (filter input, a sibling row's optimistic update) doesn't
// re-render every row in the list.
function TaskRow({ task, basePath, showAssignee = true, viewerRole, viewerId }) {
  const dueLabel = formatDueDate(task.dueDate);
  const isOverdue = dueLabel.includes('overdue') && task.status !== 'COMPLETED';
  const isCritical = isDeadlineCritical(task.dueDate, task.status);
  const inReview = task.status === 'REVIEW';
  // Overdue is a date fact layered on top of whichever real status the task
  // is in (never COMPLETED, see above) — it drives the accent bar so an
  // overdue TODO or REVIEW task reads as urgent at a glance, without
  // pretending the task's actual workflow stage doesn't matter.
  const tone = isOverdue ? TASK_STATUS_TONE.OVERDUE : TASK_STATUS_TONE[task.status];

  const isReviewerHere = viewerRole === ROLES.PROJECT_MANAGER && (!viewerId || task.project?.managerId === viewerId);
  const reviewCallout = inReview
    ? isReviewerHere
      ? { label: 'Needs your review', className: 'bg-accent-100 text-accent-700 border-accent-200', icon: Eye, pulse: true }
      : viewerRole === ROLES.TEAM_MEMBER
      ? { label: 'Awaiting review', className: 'bg-sky-50 text-sky-700 border-sky-200', icon: Send, pulse: false }
      : { label: 'In review', className: 'bg-accent-50 text-accent-600 border-accent-100', icon: Eye, pulse: false }
    : null;

  return (
    <Link
      to={`${basePath}/${task.id}`}
      className={clsx(
        'group relative flex items-center gap-3 px-3.5 py-3 transition-all duration-150 hover:bg-paper sm:gap-4 sm:px-5 sm:py-3.5',
        isReviewerHere && 'bg-accent-50/30',
        // Deadline inside the next 24 hours — same blink meetings get.
        isCritical && 'urgent-blink'
      )}
    >
      <span
        className={clsx('h-8 w-1 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-y-110', tone.bar)}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-route-700">
            {task.title}
          </p>
          {isOverdue && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger-50 px-2 py-0.5 text-[11px] font-semibold text-danger-600">
              <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
              Overdue
            </span>
          )}
          {isCritical && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              <Flame className="h-3 w-3" strokeWidth={2.5} />
              24h
            </span>
          )}
        </div>
        <p className="truncate text-xs text-ink-muted">{task.project?.name}</p>
      </div>

      {reviewCallout && (
        <span
          className={clsx(
            'hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex',
            reviewCallout.className
          )}
        >
          <reviewCallout.icon className="h-3 w-3" /> {reviewCallout.label}
        </span>
      )}

      {showAssignee && (
        <span title={task.assignee?.name ? `Assigned to ${task.assignee.name}` : 'Unassigned'}>
          <Avatar name={task.assignee?.name} size="sm" className="ring-2 ring-surface" />
        </span>
      )}

      <span className="hidden shrink-0 md:inline-block">
        <Badge meta={PRIORITY_META[task.priority]} />
      </span>

      <span className="hidden shrink-0 lg:inline-block">
        <Badge meta={TASK_STATUS_META[task.status]} />
      </span>

      <span
        className={clsx(
          'flex w-24 shrink-0 items-center justify-end gap-1 text-xs',
          isOverdue ? 'font-semibold text-danger-600' : isCritical ? 'font-semibold text-danger-500' : 'text-ink-muted'
        )}
      >
        {isCritical ? <Flame className="h-3 w-3 shrink-0" /> : <CalendarDays className="h-3 w-3 shrink-0" />}
        {dueLabel}
      </span>
    </Link>
  );
}

export default memo(TaskRow);
