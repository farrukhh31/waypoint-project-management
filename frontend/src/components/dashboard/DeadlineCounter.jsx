import { Link } from 'react-router-dom';
import { AlarmClock, Flame, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { isDeadlineCritical } from '../../utils/formatDate';

const WINDOW_DAYS = 7;

function isOpen(status) {
  return status !== 'COMPLETED' && status !== 'CANCELLED';
}

// Every task/project due within WINDOW_DAYS, counted once here so the
// dashboard has one glanceable number for "what's coming up" — same
// window DeadlinesPanel already uses. The moment any of those deadlines
// falls inside the next 24 hours, the whole card flips into the same
// "about to happen" blink treatment MeetingsCard/UpcomingMeetingBanner
// already use for meetings starting within 5 minutes, plus a gradient +
// glow "premium" treatment, so the one number that's genuinely
// time-critical is impossible to miss next to the plain stat cards
// around it.
export default function DeadlineCounter({ tasks = [], projects = [], tasksPath }) {
  const now = Date.now();
  const windowMs = WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const upcomingTasks = tasks.filter((t) => {
    if (!t.dueDate || !isOpen(t.status)) return false;
    const diff = new Date(t.dueDate).getTime() - now;
    return diff > 0 && diff <= windowMs;
  });
  const upcomingProjects = projects.filter((p) => {
    if (!p.endDate || !isOpen(p.status)) return false;
    const diff = new Date(p.endDate).getTime() - now;
    return diff > 0 && diff <= windowMs;
  });

  const urgentTaskCount = upcomingTasks.filter((t) => isDeadlineCritical(t.dueDate, t.status)).length;
  const urgentProjectCount = upcomingProjects.filter((p) => isDeadlineCritical(p.endDate, p.status)).length;
  const urgentCount = urgentTaskCount + urgentProjectCount;
  const totalCount = upcomingTasks.length + upcomingProjects.length;
  const premium = urgentCount > 0;

  if (totalCount === 0) return null;

  return (
    <div
      className={clsx(
        'relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:flex-row sm:items-center sm:gap-4 sm:p-5',
        premium ? 'urgent-blink border-accent-300/70 bg-gradient-to-br from-accent-50 via-surface to-danger-50/50' : 'border-line bg-surface'
      )}
    >
      {premium && (
        <>
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent-400/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-danger-400/15 blur-3xl" aria-hidden="true" />
        </>
      )}

      <span
        className={clsx(
          'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          premium
            ? 'animate-glow-pulse bg-gradient-to-br from-accent-400 to-danger-500 text-white shadow-lg shadow-danger-500/30'
            : 'bg-route-50 text-route-600'
        )}
      >
        {premium ? <Flame className="h-5 w-5" strokeWidth={2.25} /> : <AlarmClock className="h-5 w-5" strokeWidth={2.25} />}
      </span>

      <div className="relative min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-display text-base font-semibold text-ink sm:text-lg">
          {totalCount} {totalCount === 1 ? 'deadline' : 'deadlines'} coming up
          {premium && (
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {urgentCount} within 24h
            </span>
          )}
        </p>
        <p className="text-xs text-ink-muted">
          {premium
            ? [
                urgentTaskCount > 0 && `${urgentTaskCount} ${urgentTaskCount === 1 ? 'task' : 'tasks'}`,
                urgentProjectCount > 0 && `${urgentProjectCount} ${urgentProjectCount === 1 ? 'project' : 'projects'}`,
              ]
                .filter(Boolean)
                .join(' · ') + ' need attention right now'
            : `Across your tasks and projects · next ${WINDOW_DAYS} days`}
        </p>
      </div>

      <div className="relative flex shrink-0 items-center gap-2">
        {tasksPath && (
          <Link
            to={tasksPath}
            className={clsx(
              'group flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              premium
                ? 'border-danger-300 bg-white/70 text-danger-700 hover:bg-white'
                : 'border-line bg-surface text-ink-soft hover:border-route-200 hover:text-route-600'
            )}
          >
            View
            <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
