import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '../ui/Avatar.jsx';
import { formatDueDate } from '../../utils/formatDate';
import { startOfDay, diffDays } from '../../utils/timelineScale';

const PRIORITY_DOT = {
  LOW: 'bg-ink-muted/50',
  MEDIUM: 'bg-route-500',
  HIGH: 'bg-accent-400',
  URGENT: 'bg-danger-400',
};

// The next handful of open tasks coming due, soonest first — overdue ones
// excluded since those already get their own count in the pulse strip.
export function pickOnDeckTasks(tasks = [], limit = 5) {
  const today = startOfDay(new Date());
  return tasks
    .filter((t) => t.status !== 'COMPLETED' && t.dueDate)
    .map((t) => ({ task: t, days: diffDays(new Date(t.dueDate), today) }))
    .filter(({ days }) => days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, limit)
    .map(({ task }) => task);
}

// A horizontally-scrolling strip of chips — the widget's second real
// content block. Spotlight answers "what needs me most"; this answers
// "what's coming right after that", so the two together tell a fuller
// story instead of the card leaning on a single hero row.
export default function OnDeckTasks({ tasks = [], basePath = '/admin/tasks' }) {
  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        <CalendarClock className="h-3 w-3" />
        On deck
      </div>
      <div className="scroll-hover flex gap-2 overflow-x-auto pb-1">
        {tasks.map((task) => {
          const dueLabel = formatDueDate(task.dueDate);
          const isUrgentSoon = dueLabel === 'Due today' || dueLabel === 'Due tomorrow';
          return (
            <Link
              key={task.id}
              to={`${basePath}/${task.id}`}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-line bg-paper/60 py-1.5 pl-2 pr-3 transition-colors duration-150 hover:bg-paper hover:shadow-card"
            >
              <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_DOT[task.priority] || 'bg-ink-muted/50')} />
              {task.assignee && <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />}
              <span className="max-w-[120px] truncate text-xs font-medium text-ink group-hover:text-route-700">
                {task.title}
              </span>
              <span
                className={clsx(
                  'shrink-0 whitespace-nowrap text-[10px] font-semibold',
                  isUrgentSoon ? 'text-accent-600' : 'text-ink-muted'
                )}
              >
                {dueLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
