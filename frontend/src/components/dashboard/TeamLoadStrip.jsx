import { Users } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';

// Who's actually carrying the open work right now, ranked by open task
// count. A smaller cut of the same data TeamPerformance ranks by
// completions — this one is about current load, not who's already
// finished the most.
export function rankTeamLoad(tasks = [], limit = 6) {
  const byUser = new Map();
  for (const task of tasks) {
    if (!task.assignee || task.status === 'COMPLETED') continue;
    const id = task.assignee.id;
    if (!byUser.has(id)) byUser.set(id, { user: task.assignee, open: 0 });
    byUser.get(id).open += 1;
  }
  const rows = Array.from(byUser.values()).sort((a, b) => b.open - a.open);
  return { rows: rows.slice(0, limit), totalPeople: rows.length, totalOpen: rows.reduce((sum, r) => sum + r.open, 0) };
}

// Overlapping avatar stack + a one-line summary — fills the bottom of the
// card with "who's carrying this" instead of leaving the footer link as
// the last, thin thing in the widget.
export default function TeamLoadStrip({ tasks = [] }) {
  const { rows, totalPeople, totalOpen } = rankTeamLoad(tasks);
  if (rows.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-paper/60 px-3 py-2.5">
      <div className="flex shrink-0 items-center">
        {rows.map((row, i) => (
          <Avatar
            key={row.user.id}
            name={row.user.name}
            src={row.user.avatarUrl}
            size="sm"
            className={`ring-2 ring-surface ${i > 0 ? '-ml-2' : ''}`}
          />
        ))}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
        <Users className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          <span className="font-semibold text-ink-soft">{totalPeople}</span> teammate{totalPeople === 1 ? '' : 's'}{' '}
          carrying <span className="font-semibold text-ink-soft">{totalOpen}</span> open task{totalOpen === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}
