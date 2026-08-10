import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDueDate } from '../../utils/formatDate';

const PRIORITY_DOT = {
  LOW: 'bg-ink-muted/50',
  MEDIUM: 'bg-route-500',
  HIGH: 'bg-accent-400',
  URGENT: 'bg-danger-400',
};

// The dashboard endpoint already computes `upcomingDeadlines` (next 7 days,
// open tasks) but nothing on the Reports page surfaced it — this agenda
// list is the one genuinely new data source added here, not just a
// restyle of something that already existed.
export default function UpcomingDeadlines({ tasks = [], basePath = '/admin/tasks' }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-sky-400/10 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Upcoming deadlines</h3>
          <p className="text-xs text-ink-muted">Open tasks due in the next 7 days</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <CalendarClock className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardBody className="flex-1 p-2">
        {tasks.length === 0 ? (
          <div className="p-3">
            <EmptyState title="Nothing due soon" description="Tasks due in the next week will show up here." />
          </div>
        ) : (
          <ul className="scroll-hover flex max-h-[320px] flex-col overflow-y-auto pr-1">
            {tasks.map((task) => {
              const dueLabel = formatDueDate(task.dueDate);
              const isOverdue = dueLabel.includes('overdue');
              const isUrgentSoon = dueLabel === 'Due today' || dueLabel === 'Due tomorrow';
              return (
                <li key={task.id}>
                  <Link
                    to={`${basePath}/${task.id}`}
                    className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors duration-150 hover:bg-paper"
                  >
                    <span
                      className={clsx('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority] || 'bg-ink-muted/50')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink group-hover:text-route-700">
                        {task.title}
                      </p>
                      <p className="truncate text-xs text-ink-muted">{task.project?.name}</p>
                    </div>
                    {task.assignee && <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />}
                    <span
                      className={clsx(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        isOverdue
                          ? 'bg-danger-50 text-danger-600'
                          : isUrgentSoon
                          ? 'bg-accent-100 text-accent-700'
                          : 'bg-ink-muted/10 text-ink-soft'
                      )}
                    >
                      {dueLabel}
                    </span>
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
