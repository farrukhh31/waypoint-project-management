import { useEffect, useMemo, useState } from 'react';
import {
  ListChecks,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  TrendingUp,
  History,
  ClipboardCheck,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ReportsTabs from '../../components/shared/ReportsTabs.jsx';
import { formatDate } from '../../utils/formatDate';
import { TASK_STATUS_META } from '../../config/statuses';

const ACTION_LABELS = {
  task_created: 'created this task',
  task_updated: 'updated this task',
  task_status_changed: 'changed the task status',
  task_rescheduled: 'rescheduled this task',
};

function parseMetadata(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function describeActivity(log) {
  const label = ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ');
  const meta = parseMetadata(log.metadata);
  if (log.action === 'task_status_changed' && meta?.from && meta?.to) {
    return `${label} — ${meta.from.replace('_', ' ')} → ${meta.to.replace('_', ' ')}`;
  }
  return label;
}

// A row of tappable, color-coded member chips — each person's avatar hue
// (from Avatar's own name hash) doubles as their chip's accent so picking
// a teammate feels like picking a color, not scanning a plain list.
function MemberPicker({ members, selectedId, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(m.id)}
          className={clsx(
            'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition-all',
            m.id === selectedId
              ? 'border-route-500 bg-route-500 text-white shadow-pop'
              : 'border-line bg-surface text-ink-soft hover:border-route-300 hover:bg-route-50'
          )}
        >
          <Avatar name={m.name} size="sm" />
          {m.name}
        </button>
      ))}
    </div>
  );
}

export default function MemberReports({ basePath }) {
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/users/assignable', { params: { role: 'TEAM_MEMBER' } }).then(({ data }) => {
      if (cancelled) return;
      const list = data.data.users;
      setMembers(list);
      if (list.length) setSelectedId(list[0].id);
      setMembersLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setReportLoading(true);
    api
      .get(`/users/${selectedId}/report`)
      .then(({ data }) => {
        if (!cancelled) setReport(data.data);
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedMember = useMemo(() => members.find((m) => m.id === selectedId), [members, selectedId]);

  if (membersLoading) {
    return (
      <div className="flex flex-col gap-6">
        {basePath && <ReportsTabs basePath={basePath} />}
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-route-500" />
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {basePath && <ReportsTabs basePath={basePath} />}
        <EmptyState title="No team members yet" description="Invite team members to see their progress reports here." />
      </div>
    );
  }

  const stats = report?.stats;

  return (
    <div className="flex flex-col gap-6">
      {basePath && <ReportsTabs basePath={basePath} />}

      <Card className="p-4">
        <MemberPicker members={members} selectedId={selectedId} onSelect={setSelectedId} />
      </Card>

      {reportLoading || !report ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-route-500" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Avatar name={selectedMember?.name} size="lg" />
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">{selectedMember?.name}</h3>
              <p className="text-sm text-ink-muted">{selectedMember?.jobTitle || 'Team member'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total tasks" value={stats.totalTasks} icon={ListChecks} accent="route" />
            <StatCard label="Completed" value={stats.COMPLETED} icon={CheckCircle2} accent="success" />
            <StatCard label="In progress" value={stats.IN_PROGRESS + stats.REVIEW} icon={TrendingUp} accent="sky" />
            <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="danger" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-success-600" />
                  <h3 className="font-display text-sm font-semibold text-ink">Recently completed</h3>
                </div>
                <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600">
                  {stats.completionRate}% completion rate
                </span>
              </CardHeader>
              <CardBody>
                {report.recentCompleted.length === 0 ? (
                  <p className="text-sm text-ink-muted">No completed tasks yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {report.recentCompleted.map((task) => (
                      <li key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-success-50/50 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                          <p className="truncate text-xs text-ink-muted">{task.project?.name}</p>
                        </div>
                        <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', TASK_STATUS_META.COMPLETED.className)}>
                          {formatDate(task.updatedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-route-600" />
                  <h3 className="font-display text-sm font-semibold text-ink">Activity feed</h3>
                </div>
              </CardHeader>
              <CardBody>
                {report.activity.length === 0 ? (
                  <p className="text-sm text-ink-muted">No activity recorded yet.</p>
                ) : (
                  <ul className="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
                    {report.activity.map((log) => (
                      <li key={log.id} className="flex items-start gap-2.5">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-route-400" />
                        <div className="min-w-0">
                          <p className="text-sm text-ink-soft">
                            {describeActivity(log)}
                            {log.Task ? <span className="font-medium text-ink"> · {log.Task.title}</span> : null}
                          </p>
                          <p className="text-xs text-ink-muted">{formatDate(log.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
