import { useEffect, useState } from 'react';
import { Play, Pause, Square, Timer, CalendarClock, CalendarRange, ListChecks, Pencil, Trash2, FolderKanban } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import { useTimeEntry } from '../../hooks/useTimeEntry';
import { useTimeEntries, useTimeStats } from '../../hooks/useTimeEntries';
import { formatClock, formatDuration, formatDate } from '../../utils/formatDate';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';

// Groups a page of history rows under "Today" / "Yesterday" / a date
// heading, the way most time-tracking tools present a log.
function groupByDay(entries) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups = [];
  let current = null;
  for (const entry of entries) {
    const day = new Date(entry.stoppedAt || entry.startedAt).toDateString();
    const label = day === today ? 'Today' : day === yesterday ? 'Yesterday' : formatDate(entry.stoppedAt || entry.startedAt);
    if (!current || current.label !== label) {
      current = { label, entries: [] };
      groups.push(current);
    }
    current.entries.push(entry);
  }
  return groups;
}

function TimerPanel() {
  const { entry, loading, elapsedSeconds, start, pause, resume, stop } = useTimeEntry();
  const [label, setLabel] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.get('/projects', { params: { limit: 100 } }).then(({ data }) => setProjects(data.data.projects ?? []));
  }, []);

  useEffect(() => {
    setTaskId('');
    if (!projectId) {
      setTasks([]);
      return;
    }
    api.get('/tasks', { params: { projectId, limit: 100 } }).then(({ data }) => setTasks(data.data.tasks ?? []));
  }, [projectId]);

  async function handleStart(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setStarting(true);
    try {
      await start(label.trim(), { projectId: projectId || null, taskId: taskId || null });
      setLabel('');
      setProjectId('');
      setTaskId('');
    } finally {
      setStarting(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-route-400/10 via-surface to-surface">
        <h3 className="font-display text-base font-semibold text-ink">Timer</h3>
        <Timer className="h-4 w-4 text-ink-muted" />
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="h-40 animate-pulse rounded-lg bg-line/40" />
        ) : entry ? (
          <div className="flex flex-col items-center gap-5 py-3 text-center">
            <div>
              <p className="max-w-sm truncate text-base font-medium text-ink">{entry.label}</p>
              {(entry.project || entry.task) && (
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-ink-muted">
                  <FolderKanban className="h-3 w-3" />
                  {entry.project?.name}
                  {entry.task ? ` · ${entry.task.title}` : ''}
                </p>
              )}
            </div>
            <p
              className={clsx(
                'font-mono text-6xl font-semibold tabular-nums tracking-tight text-ink',
                entry.status === 'RUNNING' && 'text-route-600'
              )}
            >
              {formatClock(elapsedSeconds)}
            </p>
            {entry.status === 'PAUSED' && (
              <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-600">
                Paused
              </span>
            )}
            <div className="flex w-full max-w-xs gap-2">
              {entry.status === 'RUNNING' ? (
                <Button variant="secondary" size="lg" className="flex-1" onClick={pause}>
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              ) : (
                <Button variant="secondary" size="lg" className="flex-1" onClick={resume}>
                  <Play className="h-4 w-4" /> Resume
                </Button>
              )}
              <Button variant="danger" size="lg" className="flex-1" onClick={stop}>
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} className="flex flex-col gap-3 py-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What are you working on?"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={!projectId}>
                <option value="">No task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" size="lg" loading={starting} disabled={!label.trim()}>
              <Play className="h-4 w-4" /> Start timer
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

function HistoryRow({ entry, onEdit, onDelete }) {
  return (
    <div className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{entry.label}</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {entry.project?.name || 'No project'}
          {entry.task ? ` · ${entry.task.title}` : ''}
        </p>
      </div>
      <p className="w-20 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-ink">
        {formatDuration(entry.elapsedSeconds)}
      </p>
      <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button type="button" onClick={() => onEdit(entry)} className="rounded p-1.5 text-ink-muted hover:bg-paper hover:text-ink" aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => onDelete(entry)} className="rounded p-1.5 text-ink-muted hover:bg-danger-50 hover:text-danger-600" aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EditEntryModal({ entry, onClose, onSaved }) {
  const [label, setLabel] = useState(entry?.label || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setLabel(entry?.label || ''), [entry]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onSaved(entry.id, { label: label.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(entry)} onClose={onClose} title="Edit entry" className="max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!label.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Full Time Tracking page: a premium timer (with optional project/task
// linking), rolled-up stats, and a searchable, editable history of past
// entries — the personal counterpart to the Meetings page.
export default function TimeTracking() {
  const [page, setPage] = useState(1);
  const { entries, pagination, loading, refetch, updateEntry, deleteEntry } = useTimeEntries({ page, limit: 8 });
  const { stats } = useTimeStats(entries.length);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const groups = groupByDay(entries);

  return (
    <div>
      <PageHeader title="Time Tracking" description="Track what you're working on and see where your time goes." />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today" value={stats ? formatDuration(stats.todaySeconds) : '—'} icon={CalendarClock} accent="route" />
        <StatCard label="This week" value={stats ? formatDuration(stats.weekSeconds) : '—'} icon={CalendarRange} accent="accent" />
        <StatCard label="This month" value={stats ? formatDuration(stats.monthSeconds) : '—'} icon={Timer} accent="teal" />
        <StatCard label="Entries this week" value={stats ? stats.entriesThisWeek : '—'} icon={ListChecks} accent="sky" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-5">
          <TimerPanel />

          {stats && stats.byProject.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-display text-sm font-semibold text-ink">This week by project</h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                {stats.byProject.map((p) => {
                  const pct = Math.round((p.seconds / stats.weekSeconds) * 100) || 0;
                  return (
                    <div key={p.projectId || 'none'}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate text-ink-soft">{p.name}</span>
                        <span className="shrink-0 font-medium text-ink-muted">{formatDuration(p.seconds)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/50">
                        <div className="h-full rounded-full bg-route-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-display text-sm font-semibold text-ink">History</h3>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex flex-col gap-2.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-line/40" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <EmptyState title="No time tracked yet" description="Start the timer to begin building your history." />
            ) : (
              <div className="flex flex-col gap-5">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{group.label}</p>
                    <div className="flex flex-col divide-y divide-line">
                      {group.entries.map((entry) => (
                        <HistoryRow key={entry.id} entry={entry} onEdit={setEditingEntry} onDelete={setDeleteTarget} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination pagination={pagination} onPageChange={setPage} />
          </CardBody>
        </Card>
      </div>

      <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)} onSaved={updateEntry} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await deleteEntry(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Delete this entry?"
        message={`"${deleteTarget?.label ?? ''}" will be permanently removed from your history.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
