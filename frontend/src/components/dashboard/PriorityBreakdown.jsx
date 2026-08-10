import { useState } from 'react';
import { Gauge, AlertOctagon } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';

const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

// Same semantic mapping used everywhere else priority shows up (badges,
// ProjectRoute's timeline bars) — kept in sync so "urgent" reads the same
// red in every corner of the app.
const PRIORITY_STYLE = {
  LOW: { stroke: '#75778F', dot: 'bg-ink-muted/50', text: 'text-ink-soft' },
  MEDIUM: { stroke: '#5B4FE0', dot: 'bg-route-500', text: 'text-route-600' },
  HIGH: { stroke: '#FF8C1A', dot: 'bg-accent-400', text: 'text-accent-600' },
  URGENT: { stroke: '#F0324B', dot: 'bg-danger-400', text: 'text-danger-600' },
};

const RADIUS = 42;
const STROKE_WIDTH = 13;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEG = 3;

function countByPriority(items) {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  items.forEach((item) => {
    if (counts[item.priority] != null) counts[item.priority] += 1;
  });
  return counts;
}

// One premium layered donut (same construction as StatusBreakdown's) plus
// a ranked legend — replaces the old flat progress-bar pair. `tabKey` just
// namespaces the filter/gradient ids so two instances on one page (or a
// tab switch) never collide.
function PriorityDonut({ items, tabKey }) {
  const counts = countByPriority(items);
  const total = items.length;
  const activeKeys = PRIORITY_ORDER.filter((key) => counts[key] > 0);
  const urgentCount = counts.URGENT;

  let cursorDeg = -90;
  const segments = activeKeys.map((key) => {
    const value = counts[key];
    const sweep = total > 0 ? (value / total) * 360 : 0;
    const startDeg = cursorDeg;
    cursorDeg += sweep;
    return { key, value, startDeg, sweep: Math.max(sweep - (activeKeys.length > 1 ? GAP_DEG : 0), 0) };
  });

  const filterId = `priority-glow-${tabKey}`;

  if (total === 0) {
    return <EmptyState title="No data yet" description="Items will appear here once created." />;
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0 drop-shadow-[0_6px_14px_rgba(47,93,138,0.18)]">
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodOpacity="0.25" />
            </filter>
          </defs>
          <circle cx="56" cy="56" r={RADIUS} fill="none" stroke="currentColor" strokeWidth={STROKE_WIDTH} className="text-line" />
          {segments.map(({ key, startDeg, sweep }) => {
            const dash = (sweep / 360) * CIRCUMFERENCE;
            const gap = CIRCUMFERENCE - dash;
            const rotate = startDeg + 90;
            return (
              <circle
                key={key}
                cx="56"
                cy="56"
                r={RADIUS}
                fill="none"
                stroke={PRIORITY_STYLE[key].stroke}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${gap}`}
                filter={`url(#${filterId})`}
                className="transition-[stroke-dasharray] duration-700 ease-out"
                style={{ transform: `rotate(${rotate}deg)`, transformOrigin: '56px 56px' }}
              >
                <title>{`${key[0] + key.slice(1).toLowerCase()}: ${counts[key]}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold text-ink">{total}</span>
          <span className="text-[10px] text-ink-muted">total</span>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1">
        <ul className="flex flex-col gap-2">
          {PRIORITY_ORDER.map((key) => {
            const value = counts[key];
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <li key={key} className="flex items-center gap-2.5 text-xs">
                <span className={clsx('h-2 w-2 shrink-0 rounded-full shadow-sm', PRIORITY_STYLE[key].dot)} />
                <span className="w-14 shrink-0 font-medium text-ink-soft">{key[0] + key.slice(1).toLowerCase()}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: PRIORITY_STYLE[key].stroke }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-ink">{value}</span>
                <span className="w-9 shrink-0 text-right text-[11px] text-ink-muted">{pct}%</span>
              </li>
            );
          })}
        </ul>
        {urgentCount > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-danger-600">
            <AlertOctagon className="h-3 w-3" />
            {urgentCount} marked urgent
          </p>
        )}
      </div>
    </div>
  );
}

export default function PriorityBreakdown({ projects = [], tasks = [] }) {
  const [tab, setTab] = useState('tasks');
  const empty = projects.length === 0 && tasks.length === 0;
  const items = tab === 'projects' ? projects : tasks;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="flex-wrap gap-y-3 bg-gradient-to-r from-teal-400/10 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Priority mix</h3>
          <p className="text-xs text-ink-muted">
            {projects.length} projects · {tasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
            {[
              { key: 'projects', label: 'Projects' },
              { key: 'tasks', label: 'Tasks' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                  tab === t.key ? 'bg-teal-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper hover:text-ink'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <Gauge className="h-4 w-4" />
          </span>
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col justify-center">
        {empty ? (
          <EmptyState title="No priority data yet" description="Projects and tasks will appear here once created." />
        ) : (
          <PriorityDonut key={tab} items={items} tabKey={tab} />
        )}
      </CardBody>
    </Card>
  );
}
