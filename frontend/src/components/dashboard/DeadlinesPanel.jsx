import { Link } from 'react-router-dom';
import { Flag, Clock3 } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { PRIORITY_META } from '../../config/statuses';
import { formatDueDate } from '../../utils/formatDate';

const PRIORITY_ACCENT = {
  LOW: { bar: 'bg-ink-muted/40', glow: '' },
  MEDIUM: { bar: 'bg-route-500', glow: 'shadow-[0_0_0_3px_rgba(47,93,138,0.08)]' },
  HIGH: { bar: 'bg-accent-400', glow: 'shadow-[0_0_0_3px_rgba(226,163,59,0.1)]' },
  URGENT: { bar: 'bg-danger-400', glow: 'shadow-[0_0_0_3px_rgba(193,72,61,0.12)]' },
};

function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

// A premium restyle of the flat divided list: each deadline is its own
// depth-lifted card with a colored waypoint marker instead of a plain
// left border, so it reads as one family with the timeline's road motif.
export default function DeadlinesPanel({ tasks = [] }) {
  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-accent-50/60 via-surface to-surface">
        <h3 className="font-display text-base font-semibold text-ink">Upcoming deadlines</h3>
        <span className="text-xs text-ink-muted">Next 7 days</span>
      </CardHeader>
      <CardBody>
        {tasks.length === 0 ? (
          <EmptyState
            title="Nothing due this week"
            description="Tasks due in the next 7 days will show up here."
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {tasks.map((task) => {
              const accent = PRIORITY_ACCENT[task.priority] || PRIORITY_ACCENT.LOW;
              const overdue = isOverdue(task.dueDate);
              return (
                <li key={task.id}>
                  <Link
                    to={`/admin/projects/${task.project?.id}`}
                    className={clsx(
                      'group flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:shadow-pop',
                      accent.glow
                    )}
                  >
                    <span className={clsx('relative flex h-9 w-1.5 shrink-0 rounded-full', accent.bar)} />
                    <Avatar name={task.assignee?.name} size="sm" className="shrink-0 shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {task.project?.name}
                        {task.assignee?.name ? ` · ${task.assignee.name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={clsx(
                          'flex items-center gap-1 text-xs font-medium',
                          overdue ? 'text-danger-600' : 'text-ink-soft'
                        )}
                      >
                        <Clock3 className="h-3 w-3" />
                        {formatDueDate(task.dueDate)}
                      </span>
                      <span
                        className={clsx(
                          'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          PRIORITY_META[task.priority]?.className
                        )}
                      >
                        <Flag className="h-2.5 w-2.5" />
                        {PRIORITY_META[task.priority]?.label}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
