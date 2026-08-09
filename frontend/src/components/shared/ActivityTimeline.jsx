import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import { formatDate } from '../../utils/formatDate';

const ACTION_LABELS = {
  project_created: 'created the project',
  project_updated: 'updated the project details',
  members_added: 'added team members',
  member_removed: 'removed a team member',
  task_created: 'created a task',
  task_updated: 'updated a task',
  task_status_changed: 'changed a task status',
  task_submitted: 'submitted a task for review',
  task_approved: 'approved a task',
  task_changes_requested: 'requested changes on a task',
  project_submitted: 'submitted the project for approval',
  project_approved: 'approved the project',
  project_changes_requested: 'requested changes on the project',
  discussion_added: 'commented',
};

function describe(log) {
  const label = ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ');
  if (log.action === 'task_status_changed' && log.metadata?.from && log.metadata?.to) {
    return `${label} from ${log.metadata.from.replace('_', ' ')} to ${log.metadata.to.replace('_', ' ')}`;
  }
  return label;
}

export default function ActivityTimeline({ projectId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/activity/project/${projectId}`)
      .then(({ data }) => {
        if (!cancelled) setLogs(data.data.logs ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-display text-sm font-semibold text-ink">Activity</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-line/40" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-ink-muted">No activity recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-2.5">
                <Avatar name={log.actor?.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-ink-soft">
                    <span className="font-medium text-ink">{log.actor?.name}</span> {describe(log)}
                  </p>
                  <p className="text-xs text-ink-muted">{formatDate(log.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
