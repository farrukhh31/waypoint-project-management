import { Link } from 'react-router-dom';
import { Pencil, Trash2, Crown } from 'lucide-react';
import clsx from 'clsx';
import Badge from '../ui/Badge.jsx';
import Avatar from '../ui/Avatar.jsx';
import AvatarStack from '../ui/AvatarStack.jsx';
import { PROJECT_STATUS_META, PRIORITY_META, PROJECT_STATUS_TONE } from '../../config/statuses';
import { formatDueDate } from '../../utils/formatDate';

const STATUS_BAR = Object.fromEntries(Object.entries(PROJECT_STATUS_TONE).map(([k, v]) => [k, v.bar]));

export default function ProjectListRow({ project, basePath, canManage = false, onEdit, onDelete }) {
  const progress = project.progress ?? { total: 0, completed: 0 };
  const progressPct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const dueLabel = formatDueDate(project.endDate);
  const isOverdue = dueLabel.includes('overdue') && project.status !== 'COMPLETED' && project.status !== 'CANCELLED';

  function stop(e, fn) {
    e.preventDefault();
    e.stopPropagation();
    fn?.(project);
  }

  return (
    <Link to={`${basePath}/${project.id}`} className="group relative flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper">
      <span className={clsx('h-8 w-1 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-y-110', STATUS_BAR[project.status])} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-sm font-semibold text-ink transition-colors group-hover:text-route-700">
            {project.name}
          </p>
          <Badge meta={PROJECT_STATUS_META[project.status]} />
        </div>
        {project.description && <p className="mt-0.5 truncate text-xs text-ink-muted">{project.description}</p>}
      </div>

      <div className="hidden w-36 shrink-0 flex-col gap-1 sm:flex">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={clsx('h-full rounded-full transition-[width] duration-700 ease-out', STATUS_BAR[project.status])}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-muted">
          {progress.total > 0 ? `${progress.completed}/${progress.total} tasks · ${progressPct}%` : 'No tasks yet'}
        </p>
      </div>

      <span className="hidden shrink-0 md:inline-block">
        <Badge meta={PRIORITY_META[project.priority]} />
      </span>

      <span
        className={clsx(
          'hidden w-24 shrink-0 text-xs lg:inline-block',
          isOverdue ? 'font-medium text-danger-600' : 'text-ink-muted'
        )}
      >
        {dueLabel}
      </span>

      <div className="hidden shrink-0 items-center gap-2 xl:flex">
        <AvatarStack people={project.members || []} max={2} />
        {project.manager && (
          <span className="relative" title={`Managed by ${project.manager.name}`}>
            <Avatar name={project.manager.name} size="sm" className="ring-2 ring-surface" />
            <Crown className="absolute -right-1 -top-1.5 h-3 w-3 rounded-full bg-accent-400 p-[1px] text-white" strokeWidth={2.5} />
          </span>
        )}
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => stop(e, onEdit)}
            aria-label={`Edit ${project.name}`}
            className="rounded p-1.5 text-ink-muted hover:bg-route-50 hover:text-route-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => stop(e, onDelete)}
            aria-label={`Delete ${project.name}`}
            className="rounded p-1.5 text-ink-muted hover:bg-danger-50 hover:text-danger-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </Link>
  );
}
