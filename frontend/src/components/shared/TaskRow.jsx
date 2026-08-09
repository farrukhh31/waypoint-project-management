import { Link } from 'react-router-dom';
import { Eye, Send } from 'lucide-react';
import clsx from 'clsx';
import Badge from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import { TASK_STATUS_META, PRIORITY_META } from '../../config/statuses';
import { formatDueDate } from '../../utils/formatDate';
import { ROLES } from '../../config/roles';

const STATUS_DOT = {
  TODO: 'bg-ink-muted',
  IN_PROGRESS: 'bg-route-500',
  REVIEW: 'bg-accent-400',
  COMPLETED: 'bg-success-400',
};

/**
 * @param {string} [viewerRole] - current user's role, used to tailor the
 *   REVIEW-status callout: a Project Manager sees "Needs your review" (this
 *   is their queue), a Team Member sees "Awaiting review" (their own
 *   submission), anyone else gets a neutral "In review".
 * @param {string} [viewerId] - current user's id, so the PM callout only
 *   fires for tasks in projects they actually manage (not just any REVIEW
 *   row that happens to render in a shared list).
 */
export default function TaskRow({ task, basePath, showAssignee = true, viewerRole, viewerId }) {
  const dueLabel = formatDueDate(task.dueDate);
  const isOverdue = dueLabel.includes('overdue') && task.status !== 'COMPLETED';
  const inReview = task.status === 'REVIEW';

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
        'group flex items-center gap-4 px-5 py-3.5 transition-all duration-150 hover:translate-x-0.5 hover:bg-paper',
        isReviewerHere && 'bg-accent-50/30'
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        {inReview && (
          <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', STATUS_DOT[task.status])} />
        )}
        <span className={clsx('relative inline-flex h-2 w-2 rounded-full', STATUS_DOT[task.status])} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink transition-colors group-hover:text-route-700">
          {task.title}
        </p>
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
      {showAssignee && <Avatar name={task.assignee?.name} size="sm" />}
      <Badge meta={PRIORITY_META[task.priority]} />
      <Badge meta={TASK_STATUS_META[task.status]} />
      <span className={clsx('w-24 shrink-0 text-right text-xs', isOverdue ? 'font-medium text-danger-600' : 'text-ink-muted')}>
        {dueLabel}
      </span>
    </Link>
  );
}
