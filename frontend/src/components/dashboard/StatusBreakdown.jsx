import TiltCard from '../ui/TiltCard.jsx';

// Same semantics as the badges in config/statuses.js (route = in motion,
// accent = needs attention, success = done, danger = stopped), but as
// ring-stroke colors for the donut below.
const STROKE = {
  PLANNED: '#75778F',
  ACTIVE: '#5B4FE0',
  ON_HOLD: '#FF8C1A',
  PENDING_APPROVAL: '#12AEDE',
  COMPLETED: '#17B26A',
  CANCELLED: '#F0324B',
  TODO: '#75778F',
  IN_PROGRESS: '#5B4FE0',
  REVIEW: '#FF8C1A',
};

const DOT = {
  PLANNED: 'bg-ink-muted/40',
  ACTIVE: 'bg-route-500',
  ON_HOLD: 'bg-accent-400',
  COMPLETED: 'bg-success-400',
  CANCELLED: 'bg-danger-400',
  TODO: 'bg-ink-muted/40',
  IN_PROGRESS: 'bg-route-500',
  REVIEW: 'bg-accent-400',
};

const RADIUS = 34;
const STROKE_WIDTH = 11;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEG = 3; // small visual gap between segments, in degrees

// A premium, dynamic replacement for the old flat progress bar: a
// layered 3D donut (drop shadow + soft glow + gradient rim) with each
// status as its own rounded arc segment, animated in on mount/update.
// `order` fixes segment order, `data` is the raw [{ status, count }]
// rows the dashboard API returns.
export default function StatusBreakdown({ title, order, meta, data = [] }) {
  const counts = Object.fromEntries(data.map((row) => [row.status, Number(row.count)]));
  const total = order.reduce((sum, key) => sum + (counts[key] || 0), 0);
  const activeKeys = order.filter((key) => counts[key] > 0);

  let cursorDeg = -90; // start at 12 o'clock
  const segments = activeKeys.map((key) => {
    const value = counts[key];
    const sweep = total > 0 ? (value / total) * 360 : 0;
    const startDeg = cursorDeg;
    cursorDeg += sweep;
    return { key, value, startDeg, sweep: Math.max(sweep - (activeKeys.length > 1 ? GAP_DEG : 0), 0) };
  });

  const gradientId = `status-glow-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <TiltCard maxTilt={4} className="rounded-lg">
      <div className="rounded-lg border border-line bg-gradient-to-br from-surface via-surface to-paper p-4 shadow-card transition-shadow duration-200 hover:shadow-pop">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 drop-shadow-[0_6px_14px_rgba(47,93,138,0.18)]">
            <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
              <defs>
                <filter id={gradientId} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.25" />
                </filter>
              </defs>
              <circle cx="46" cy="46" r={RADIUS} fill="none" stroke="currentColor" strokeWidth={STROKE_WIDTH} className="text-line" />
              {segments.map(({ key, startDeg, sweep }) => {
                const dash = (sweep / 360) * CIRCUMFERENCE;
                const gap = CIRCUMFERENCE - dash;
                const rotate = startDeg + 90; // convert back since svg already -rotate-90
                return (
                  <circle
                    key={key}
                    cx="46"
                    cy="46"
                    r={RADIUS}
                    fill="none"
                    stroke={STROKE[key] || '#75778F'}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${gap}`}
                    filter={`url(#${gradientId})`}
                    className="transition-[stroke-dasharray] duration-700 ease-out"
                    style={{ transform: `rotate(${rotate}deg)`, transformOrigin: '46px 46px' }}
                  >
                    <title>{`${meta[key]?.label ?? key}: ${counts[key] || 0}`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-semibold text-ink">{total}</span>
              <span className="text-[10px] text-ink-muted">total</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-ink">{title}</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {order.map((key) => (
                <li key={key} className="flex items-center justify-between gap-2 text-xs text-ink-soft">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={`h-2 w-2 shrink-0 rounded-full shadow-sm ${DOT[key]}`} />
                    {meta[key]?.label ?? key}
                  </span>
                  <span className="font-medium text-ink">{counts[key] || 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
