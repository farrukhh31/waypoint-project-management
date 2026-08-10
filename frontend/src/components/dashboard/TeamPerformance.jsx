import { Link } from 'react-router-dom';
import { Trophy, Crown, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';

const MEDAL = ['text-accent-500', 'text-ink-muted', 'text-[#B87333]']; // gold / silver / bronze-ish

// Ranks assignees by completed tasks so the page has one "who's actually
// moving work" leaderboard instead of only aggregate counts. Built from
// the same task list PriorityBreakdown already fetches — no extra
// request — so it's just a different cut of data already on the page.
export function rankContributors(tasks) {
  const byUser = new Map();

  tasks.forEach((task) => {
    if (!task.assignee) return;
    const id = task.assignee.id;
    if (!byUser.has(id)) {
      byUser.set(id, { user: task.assignee, total: 0, completed: 0, overdue: 0 });
    }
    const row = byUser.get(id);
    row.total += 1;
    if (task.status === 'COMPLETED') row.completed += 1;
    else if (task.dueDate && new Date(task.dueDate) < new Date()) row.overdue += 1;
  });

  return Array.from(byUser.values())
    .sort((a, b) => b.completed - a.completed || b.total - a.total)
    .slice(0, 5);
}

export default function TeamPerformance({
  tasks = [],
  workloadPath = '/admin/team',
  workloadLabel = 'View full workload',
  title = 'Top contributors',
  subtitle = 'Ranked by tasks completed',
}) {
  const rows = rankContributors(tasks);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-accent-400/10 via-surface to-surface">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-ink">{title}</h3>
          <p className="truncate text-xs text-ink-muted">{subtitle}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
          <Trophy className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col">
        {rows.length === 0 ? (
          <EmptyState title="No assigned tasks yet" description="Contributors will be ranked here once tasks are assigned and completed." />
        ) : (
          <ul className="flex flex-1 flex-col justify-center gap-2.5">
            {rows.map((row, i) => {
              const pct = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
              return (
                <li
                  key={row.user.id}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-pop"
                >
                  <span className="flex w-5 shrink-0 items-center justify-center">
                    {i < 3 ? (
                      <Crown className={clsx('h-4 w-4', MEDAL[i])} strokeWidth={2.25} />
                    ) : (
                      <span className="text-xs font-semibold text-ink-muted">{i + 1}</span>
                    )}
                  </span>
                  <Avatar name={row.user.name} src={row.user.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{row.user.name}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 shadow-sm transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-sm font-semibold text-ink">
                      {row.completed}
                      <span className="text-ink-muted">/{row.total}</span>
                    </p>
                    <p className="text-[10px] text-ink-muted">{pct}% done</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {workloadPath && (
          <Link
            to={workloadPath}
            className="group mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-ink-muted transition-colors hover:border-route-300 hover:text-route-600"
          >
            {workloadLabel}
            <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
