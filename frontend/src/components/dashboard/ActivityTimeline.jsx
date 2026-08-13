import { Link } from 'react-router-dom';
import { Activity as ActivityIcon } from 'lucide-react';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { ACTION_META, TONE_DOT, describe } from './OrgActivityFeed.jsx';
import { formatRelativeTime } from '../../utils/formatDate';

// Extruded, "raised button" bevel treatment shared by the three category
// segments in each day's bar — a light top edge + a real drop shadow so
// the stack reads as a physical, stacked object rather than a flat tint.
const SEGMENT_STYLE = {
  project: 'bg-gradient-to-b from-route-300 to-route-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
  task: 'bg-gradient-to-b from-accent-300 to-accent-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
  team: 'bg-gradient-to-b from-success-300 to-success-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
};

const LEGEND = [
  { key: 'project', label: 'Projects', dot: 'bg-route-500' },
  { key: 'task', label: 'Tasks', dot: 'bg-accent-400' },
  { key: 'team', label: 'Team', dot: 'bg-success-400' },
];

// A week of stacked, extruded bars standing on a "shelf" — depth comes
// from the segment bevels plus a perspective wrapper that very slightly
// tilts the whole row, so the chart reads as sitting proud of the card
// rather than printed flat on it.
function WeekPulse({ days = [] }) {
  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="rounded-xl border border-line bg-gradient-to-b from-paper/80 to-paper/30 p-3 [perspective:800px]">
      <div
        className="flex items-end justify-between gap-2 sm:gap-3"
        style={{ transform: 'rotateX(6deg)', transformStyle: 'preserve-3d' }}
      >
        {days.map((day, i) => {
          const isToday = i === days.length - 1;
          const heightPx = Math.max(10, Math.round((day.total / maxTotal) * 84));
          const segments = ['project', 'task', 'team'].filter((cat) => day[cat] > 0);

          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="group relative flex w-full max-w-[30px] flex-col-reverse overflow-hidden rounded-md transition-transform duration-200 hover:-translate-y-1"
                style={{ height: heightPx }}
                title={`${day.label} — ${day.total} activit${day.total === 1 ? 'y' : 'ies'}`}
              >
                {day.total === 0 ? (
                  <div className="h-full w-full rounded-md bg-line/30" />
                ) : (
                  segments.map((cat) => (
                    <div
                      key={cat}
                      className={clsx('w-full transition-all duration-300', SEGMENT_STYLE[cat])}
                      style={{ height: `${(day[cat] / day.total) * 100}%` }}
                    />
                  ))
                )}
                {isToday && (
                  <span className="pointer-events-none absolute inset-x-0 -top-1 h-1 rounded-full bg-accent-400 shadow-[0_0_8px_2px_rgba(230,126,34,0.5)]" />
                )}
              </div>
              <span className={clsx('text-[11px] font-medium', isToday ? 'text-route-600' : 'text-ink-muted')}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] text-ink-muted">
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className={clsx('h-2 w-2 rounded-full', l.dot)} /> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// One log entry as a small floating card on a connecting rail — TiltCard
// gives it a real pointer-tracked 3D tilt + glare on hover, on top of the
// existing elevation/lift language the rest of the dashboard already uses.
function TimelineEntry({ log, basePath, isLast }) {
  const meta = describe(log);
  const Icon = meta.icon;

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" aria-hidden="true" />}
      <div className="relative z-10 shrink-0">
        <Avatar name={log.actor?.name} src={log.actor?.avatarUrl} size="sm" />
        <span
          className={clsx(
            'absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-surface',
            TONE_DOT[meta.tone]
          )}
        >
          <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
      </div>
      <TiltCard maxTilt={3} className="min-w-0 flex-1 rounded-lg">
        <div className="rounded-lg border border-line bg-surface px-3 py-2.5 shadow-card transition-shadow duration-200 hover:shadow-pop">
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">{log.actor?.name ?? 'Someone'}</span> {meta.label}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-muted">
            {log.Project?.id && (
              <>
                <Link
                  to={`${basePath}/${log.Project.id}`}
                  className="truncate font-medium text-route-600 transition-colors hover:text-route-700 hover:underline"
                >
                  {log.Project.name}
                </Link>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="shrink-0">{formatRelativeTime(log.createdAt)}</span>
          </div>
        </div>
      </TiltCard>
    </li>
  );
}

// Replaces the old split ActivityFeed (bubble chart only) + OrgActivityFeed
// (real log only) pairing with one card: the week's shape up top, who
// actually did what right below it — and both halves are fed the same
// role-scoped data the /api/dashboard endpoint already returns (org-wide
// for Admin, this PM's projects for a PM, this member's projects for a
// Team Member) rather than anything generic.
export default function ActivityTimeline({
  activityByDay = [],
  logs = [],
  basePath = '/admin/projects',
  title = 'Recent activity',
  subtitle = 'Across every project',
}) {
  const hasPulse = activityByDay.some((d) => d.total > 0);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-success-400/10 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-100 text-success-700 shadow-sm">
          <ActivityIcon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-4">
        {activityByDay.length > 0 && hasPulse && <WeekPulse days={activityByDay} />}

        {logs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-3">
            <EmptyState title="Nothing yet" description="Project and task activity will show up here as it happens." />
          </div>
        ) : (
          <ul className="scroll-hover flex max-h-[340px] flex-col overflow-y-auto pr-1">
            {logs.map((log, i) => (
              <TimelineEntry key={log.id} log={log} basePath={basePath} isLast={i === logs.length - 1} />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
