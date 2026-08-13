import { Link } from 'react-router-dom';
import { Flag, MapPin, ArrowRight } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { PROJECT_STATUS_META, PROJECT_STATUS_TONE } from '../../config/statuses';
import { formatDueDate } from '../../utils/formatDate';
import { startOfDay, diffDays } from '../../utils/timelineScale';

// Picks the single most relevant project to headline the widget: the
// open project (not COMPLETED/CANCELLED) whose end date is soonest. Ties
// broken by whichever has less task-progress left, so a project that's
// further behind wins the spotlight over one that's basically done.
export function pickSpotlightProject(projects = []) {
  const today = startOfDay(new Date());
  const candidates = projects.filter(
    (p) => p.endDate && p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
  );
  if (candidates.length === 0) return null;

  return candidates
    .map((p) => ({ project: p, days: diffDays(new Date(p.endDate), today) }))
    .sort((a, b) => {
      if (a.days !== b.days) return a.days - b.days;
      const aLeft = a.project.progress ? a.project.progress.total - a.project.progress.completed : 0;
      const bLeft = b.project.progress ? b.project.progress.total - b.project.progress.completed : 0;
      return bLeft - aLeft;
    })[0].project;
}

// A winding route with a waypoint flag at the end — the same "journey"
// motif as the rest of the app, just given room to breathe as an actual
// illustration instead of a 16px icon. Pure SVG, no image assets.
function RouteIllustration({ tone = '#5B4FE0', pct = 50 }) {
  const flagAt = Math.max(8, Math.min(92, pct));
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <path
        d="M -10 140 C 40 140, 30 90, 80 85 C 130 80, 110 40, 160 35 C 185 32, 190 20, 205 15"
        stroke="url(#spotlight-road)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M -10 140 C 40 140, 30 90, 80 85 C 130 80, 110 40, 160 35 C 185 32, 190 20, 205 15"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="3 7"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="spotlight-road" x1="0" y1="140" x2="200" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tone} stopOpacity="0.15" />
          <stop offset="1" stopColor={tone} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* Start pin */}
      <circle cx="-4" cy="139" r="5" fill={tone} fillOpacity="0.5" />
      {/* Progress marker along the road, proportional to elapsed time */}
      <circle
        cx={-10 + flagAt * 2.2}
        cy={140 - flagAt * 1.1}
        r="5.5"
        fill="white"
        stroke={tone}
        strokeWidth="3"
        className="drop-shadow-sm"
      />
      {/* Destination flag */}
      <g transform="translate(196, 4)">
        <line x1="0" y1="0" x2="0" y2="26" stroke={tone} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 0.5 1 L 16 6 L 0.5 12 Z" fill={tone} />
      </g>
    </svg>
  );
}

// Fills the widget with one meaningfully-sized story ("here's the project
// that needs you next") instead of leaving open space above the compact
// list — the list still does the browsing job, this does the at-a-glance
// job.
export default function ProjectSpotlight({ project, basePath = '/admin/projects' }) {
  if (!project) return null;

  const statusMeta = PROJECT_STATUS_META[project.status];
  const tone = PROJECT_STATUS_TONE[project.status]?.solid || '#5B4FE0';
  const progress = project.progress;
  const donePct = progress?.total ? Math.round((progress.completed / progress.total) * 100) : null;
  const today = startOfDay(new Date());
  const daysLeft = diffDays(new Date(project.endDate), today);
  const elapsedPct =
    project.startDate && project.endDate
      ? Math.min(
          100,
          Math.max(0, (diffDays(today, new Date(project.startDate)) / Math.max(diffDays(new Date(project.endDate), new Date(project.startDate)), 1)) * 100)
        )
      : 50;

  return (
    <Link
      to={`${basePath}/${project.id}`}
      className="group relative flex items-stretch gap-4 overflow-hidden rounded-lg border border-line bg-gradient-to-br from-paper/80 to-surface px-4 py-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="hidden w-28 shrink-0 sm:block">
        <RouteIllustration tone={tone} pct={elapsedPct} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
          <MapPin className="h-3 w-3" />
          Spotlight
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate font-display text-base font-semibold text-ink group-hover:text-route-600">
            {project.name}
          </h4>
          {statusMeta && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          )}
        </div>

        {project.description && (
          <p className="line-clamp-1 text-xs text-ink-muted">{project.description}</p>
        )}

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 max-w-[180px] overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${donePct ?? elapsedPct}%`, backgroundColor: tone }}
            />
          </div>
          {progress?.total ? (
            <span className="whitespace-nowrap text-[11px] text-ink-muted">
              <span className="font-semibold text-ink-soft">{progress.completed}</span>/{progress.total} tasks
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <span
            className={`flex items-center gap-1 font-medium ${daysLeft < 0 ? 'text-danger-600' : daysLeft <= 3 ? 'text-accent-600' : 'text-ink-soft'}`}
          >
            <Flag className="h-3.5 w-3.5" />
            {formatDueDate(project.endDate)}
          </span>
          {project.manager && (
            <span className="flex items-center gap-1.5">
              <Avatar name={project.manager.name} size="sm" />
              {project.manager.name}
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="absolute right-3 top-3 h-4 w-4 text-ink-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </Link>
  );
}
