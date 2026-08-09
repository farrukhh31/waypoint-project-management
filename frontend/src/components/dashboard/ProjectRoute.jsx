import { MapPin, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDate } from '../../utils/formatDate';

const PRIORITY_BAR = {
  LOW: 'bg-ink-muted/40',
  MEDIUM: 'bg-route-500',
  HIGH: 'bg-accent-400',
  URGENT: 'bg-danger-400',
};

const DAY = 86400000;

// Every project is a journey: a start pin, a stretch of road, an end
// flag. Laying the active projects out on one shared dotted route (the
// same motif the task StatusTracker uses) is the one bold move on this
// page — everything else stays as quiet as the rest of the app.
export default function ProjectRoute({ projects = [] }) {
  const withDates = projects.filter((p) => p.startDate && p.endDate);

  let rangeStart;
  let rangeEnd;
  let todayPct = null;

  if (withDates.length > 0) {
    const starts = withDates.map((p) => new Date(p.startDate).getTime());
    const ends = withDates.map((p) => new Date(p.endDate).getTime());
    const rawStart = Math.min(...starts);
    const rawEnd = Math.max(...ends);
    const pad = Math.max((rawEnd - rawStart) * 0.06, DAY * 2);
    rangeStart = rawStart - pad;
    rangeEnd = rawEnd + pad;

    const now = Date.now();
    if (now >= rangeStart && now <= rangeEnd) {
      todayPct = ((now - rangeStart) / (rangeEnd - rangeStart)) * 100;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-wrap gap-y-2">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Project route</h3>
          <p className="text-xs text-ink-muted">Active projects, start to deadline</p>
        </div>
        <div className="flex items-center gap-4">
          {withDates.length > 0 && (
            <div className="hidden items-center gap-3 sm:flex">
              {Object.entries(PRIORITY_BAR).map(([priority, cls]) => (
                <span key={priority} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />
                  {priority[0] + priority.slice(1).toLowerCase()}
                </span>
              ))}
            </div>
          )}
          {rangeStart != null && (
            <span className="hidden text-xs text-ink-muted lg:block">
              {formatDate(rangeStart)} — {formatDate(rangeEnd)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {withDates.length === 0 ? (
          <EmptyState
            title="No active projects on the road"
            description="Projects marked Active with a start and end date will appear here as a timeline."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {withDates.map((project) => {
              const start = new Date(project.startDate).getTime();
              const end = new Date(project.endDate).getTime();
              const left = ((start - rangeStart) / (rangeEnd - rangeStart)) * 100;
              const width = Math.max(((end - start) / (rangeEnd - rangeStart)) * 100, 3);

              return (
                <Link
                  key={project.id}
                  to={`/admin/projects/${project.id}`}
                  className="group block rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-paper"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink group-hover:text-route-600">
                      {project.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                      {project.manager && <Avatar name={project.manager.name} size="sm" />}
                      <span className="hidden sm:inline">{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
                    </div>
                  </div>

                  <div className="route-line relative h-px w-full">
                    {todayPct != null && (
                      <div
                        className="absolute -top-3 h-[22px] w-px bg-accent-500/70"
                        style={{ left: `${todayPct}%` }}
                        title="Today"
                      />
                    )}
                    <div
                      className="absolute -top-[6px] flex items-center transition-transform group-hover:-translate-y-0.5"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <MapPin className="h-3 w-3 shrink-0 -translate-x-1 text-ink-soft" />
                      <span
                        className={`h-2 flex-1 rounded-full shadow-sm ${PRIORITY_BAR[project.priority] || 'bg-route-500'}`}
                      />
                      <Flag className="h-3 w-3 shrink-0 translate-x-1 text-ink-soft" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
