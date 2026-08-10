import clsx from 'clsx';

// The video's signature "pill of bubbles" weekly activity chart, redone in
// the Waypoint palette: one rounded capsule per day, stacked circles sized
// by count (route = project activity, accent = task activity, success =
// team/member activity) rather than the reference's dark-mode bubble mix.
const CATEGORY_STYLE = {
  project: { fill: 'bg-route-400', ring: 'ring-route-200' },
  task: { fill: 'bg-accent-400', ring: 'ring-accent-200' },
  team: { fill: 'bg-success-400', ring: 'ring-success-100' },
};

function bubbleSize(count, max) {
  if (count <= 0) return 0;
  const min = 10;
  const cap = 26;
  if (max <= 0) return min;
  return Math.round(min + (cap - min) * Math.min(count / max, 1));
}

export default function ActivityPillChart({ days = [] }) {
  const maxCount = Math.max(1, ...days.flatMap((d) => [d.project, d.task, d.team]));

  return (
    <div className="flex items-end justify-between gap-2 sm:gap-3">
      {days.map((day, i) => {
        const isToday = i === days.length - 1;
        const bubbles = ['project', 'task', 'team']
          .map((cat) => ({ cat, count: day[cat], size: bubbleSize(day[cat], maxCount) }))
          .filter((b) => b.size > 0);

        return (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={clsx(
                'relative flex h-32 w-full max-w-[34px] flex-col-reverse items-center gap-1 rounded-full border py-2 shadow-[inset_0_1px_3px_rgba(18,23,43,0.06)] transition-shadow duration-200 hover:shadow-pop',
                isToday ? 'border-route-300 bg-route-400/10' : 'border-line bg-paper/70'
              )}
              title={`${day.label} — ${day.total} activit${day.total === 1 ? 'y' : 'ies'}`}
            >
              {bubbles.length === 0 ? (
                <span className="h-2.5 w-2.5 rounded-full bg-ink-muted/20" />
              ) : (
                bubbles.map(({ cat, size }) => (
                  <span
                    key={cat}
                    className={clsx('shrink-0 rounded-full shadow-sm ring-2 ring-white', CATEGORY_STYLE[cat].fill)}
                    style={{ width: size, height: size }}
                  />
                ))
              )}
            </div>
            <span className={clsx('text-[11px] font-medium', isToday ? 'text-route-600' : 'text-ink-muted')}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
