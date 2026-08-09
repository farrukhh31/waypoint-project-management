import { Link } from 'react-router-dom';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { PRIORITY_META } from '../../config/statuses';
import { formatDueDate } from '../../utils/formatDate';

// `linkTo(task)` decides where a row navigates — task detail for
// PM/Team Member portals, or the parent project for Admin (who has no
// standalone task view, only project-level monitoring).
export default function DeadlinesList({ tasks = [], linkTo }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-display text-base font-semibold text-ink">Upcoming deadlines</h3>
        <span className="text-xs text-ink-muted">Next 7 days</span>
      </CardHeader>
      <CardBody className="p-0">
        {tasks.length === 0 ? (
          <EmptyState
            title="Nothing due this week"
            description="Tasks due in the next 7 days will show up here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  to={linkTo(task)}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-paper"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                    <p className="truncate text-xs text-ink-muted">{task.project?.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge meta={PRIORITY_META[task.priority]} />
                    <span className="text-xs text-ink-muted">{formatDueDate(task.dueDate)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
