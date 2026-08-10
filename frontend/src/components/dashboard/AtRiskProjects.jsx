import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { PROJECT_STATUS_TONE } from '../../config/statuses';

// Reuses the per-project `progress` block listProjects already computes
// (total/completed/overdue) — no new endpoint, just a sharper cut of data
// that's already on the page: projects carrying open, overdue tasks,
// ranked by how many, so risk is visible at a glance instead of buried
// inside each project's own card.
export default function AtRiskProjects({ projects = [], basePath = '/admin/projects' }) {
  const atRisk = projects
    .filter((p) => (p.progress?.overdue || 0) > 0)
    .sort((a, b) => (b.progress?.overdue || 0) - (a.progress?.overdue || 0))
    .slice(0, 6);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-danger-400/10 via-surface to-surface">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Projects at risk</h3>
          <p className="text-xs text-ink-muted">Carrying overdue, open tasks</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
          <ShieldAlert className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col">
        {atRisk.length === 0 ? (
          <EmptyState title="Nothing at risk" description="Projects with overdue tasks will surface here." />
        ) : (
          <ul className="flex flex-1 flex-col justify-center gap-2.5">
            {atRisk.map((project) => {
              const tone = PROJECT_STATUS_TONE[project.status] || PROJECT_STATUS_TONE.PLANNED;
              const progress = project.progress || { total: 0, completed: 0, overdue: 0 };
              const pct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
              return (
                <li key={project.id}>
                  <Link
                    to={`${basePath}/${project.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-danger-200 hover:shadow-pop"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink group-hover:text-route-700">
                        {project.name}
                      </p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                        <div
                          className={`h-full rounded-full ${tone.bar} shadow-sm transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-danger-50 px-2.5 py-1 text-xs font-semibold text-danger-600">
                      {progress.overdue} overdue
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
