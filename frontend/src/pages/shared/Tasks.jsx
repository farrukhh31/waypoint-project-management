import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  ListChecks,
  CircleDot,
  Loader2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-react';
import clsx from 'clsx';
import { useList } from '../../hooks/useList';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/roles';
import { TASK_STATUSES, TASK_STATUS_META, TASK_STATUS_TONE, PRIORITIES, PRIORITY_META } from '../../config/statuses';
import PageHeader from '../../components/shared/PageHeader.jsx';
import { Toolbar, SearchField, Select } from '../../components/shared/Toolbar.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import TaskRow from '../../components/shared/TaskRow.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import TaskForm from '../../components/forms/TaskForm.jsx';

const STATUS_ICON = {
  TODO: CircleDot,
  IN_PROGRESS: Loader2,
  REVIEW: Eye,
  COMPLETED: CheckCircle2,
};

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

function StatusPill({ label, count, dot, active, danger = false, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
        active && !danger && 'border-route-500 bg-route-500 text-white shadow-pop',
        active && danger && 'border-danger-400 bg-danger-400 text-white shadow-pop',
        !active &&
          !danger &&
          'border-line bg-surface text-ink-soft hover:-translate-y-0.5 hover:border-route-200 hover:bg-route-50 hover:text-route-700 hover:shadow-card',
        !active &&
          danger &&
          'border-line bg-surface text-ink-soft hover:-translate-y-0.5 hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 hover:shadow-card'
      )}
    >
      {Icon ? (
        <Icon className={clsx('h-3.5 w-3.5', active ? 'text-white' : danger ? 'text-danger-500' : undefined)} />
      ) : (
        dot && <span className={clsx('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : dot)} />
      )}
      {label}
      <span
        className={clsx(
          'rounded-full px-1.5 py-px text-xs tabular-nums',
          active ? 'bg-white/20' : 'bg-ink-muted/10 text-ink-muted'
        )}
      >
        {count ?? 0}
      </span>
    </button>
  );
}

function RowSkeleton({ delay }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3.5 animate-[fade-in-up_0.4s_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-8 w-1 shrink-0 animate-pulse rounded-full bg-line" />
      <div className="min-w-0 flex-1">
        <div className="h-3.5 w-1/3 animate-pulse rounded bg-line" />
        <div className="mt-1.5 h-2.5 w-1/5 animate-pulse rounded bg-line" />
      </div>
      <div className="hidden h-7 w-7 shrink-0 animate-pulse rounded-full bg-line sm:block" />
      <div className="hidden h-5 w-16 shrink-0 animate-pulse rounded-full bg-line md:block" />
      <div className="h-3 w-14 shrink-0 animate-pulse rounded bg-line" />
    </div>
  );
}

// Route-relative: rendered at /admin/tasks, /pm/tasks, /team/tasks. At
// /pm/tasks a PM sees every task across their projects; at /team/tasks a
// Team Member only sees their own; at /admin/tasks an Admin sees literally
// everything (the backend scopes this automatically from the JWT, so the
// query params are identical across all three).
export default function Tasks({ basePath }) {
  const { user } = useAuth();
  const canCreate = user.role === ROLES.PROJECT_MANAGER || user.role === ROLES.ADMIN;
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // Lets the Topbar's "Create" shortcut (?new=1) open this form directly.
  useEffect(() => {
    if (searchParams.get('new') === '1' && canCreate) {
      setFormOpen(true);
      setSearchParams((params) => {
        params.delete('new');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, canCreate]);

  // Lets dashboard/report shortcuts like "Needs your review"
  // (?status=REVIEW) or "Overdue tasks" (?status=OVERDUE) land straight on
  // a pre-filtered list instead of an unfiltered one.
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== status) {
      setStatus(statusParam);
      setSearchParams((params) => {
        params.delete('status');
        return params;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { items, pagination, meta, loading, refetch } = useList(
    '/tasks',
    'tasks',
    { search, status, priority, sortBy, order, page },
    [search, status, priority, sortBy, order, page]
  );

  const statusCounts = meta?.statusCounts || {};
  const overdueCount = meta?.overdueCount || 0;
  const totalCount = useMemo(
    () => TASK_STATUSES.reduce((sum, s) => sum + (statusCounts[s] || 0), 0),
    [statusCounts]
  );

  function updateStatus(value) {
    setStatus((current) => (current === value ? '' : value));
    setPage(1);
  }

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-route-500 text-white shadow-lg shadow-route-500/30">
              <ListChecks className="h-4 w-4" strokeWidth={2.25} />
            </span>
            Tasks
          </span>
        }
        description={
          user.role === ROLES.ADMIN
            ? 'Every task across every project.'
            : user.role === ROLES.PROJECT_MANAGER
            ? 'Tasks across every project you manage.'
            : 'Tasks assigned to you.'
        }
        action={
          canCreate && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          )
        }
      />

      {/* At-a-glance summary — same StatCard used on the dashboards, so
          Tasks gets a premium overview strip for free. */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total tasks" value={totalCount} icon={ListChecks} accent="route" tilt />
        <StatCard label="In progress" value={statusCounts.IN_PROGRESS || 0} icon={Loader2} accent="accent" tilt />
        <StatCard label="In review" value={statusCounts.REVIEW || 0} icon={Eye} accent="sky" tilt />
        <StatCard label="Completed" value={statusCounts.COMPLETED || 0} icon={CheckCircle2} accent="success" tilt />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          accent="danger"
          tilt
          hint="Open tasks past their due date"
        />
      </div>

      {/* Status filter pills, doubling as a live breakdown, plus the
          Overdue pill — a date fact rather than a real workflow status
          (see config/statuses.js), styled danger to stand apart from the
          four real ones. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill label="All" count={totalCount} active={status === ''} onClick={() => updateStatus('')} />
        {TASK_STATUSES.map((s) => (
          <StatusPill
            key={s}
            label={TASK_STATUS_META[s].label}
            count={statusCounts[s]}
            dot={TASK_STATUS_TONE[s].dot}
            icon={STATUS_ICON[s]}
            active={status === s}
            onClick={() => updateStatus(s)}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
        <StatusPill
          label="Overdue"
          count={overdueCount}
          icon={AlertTriangle}
          danger
          active={status === 'OVERDUE'}
          onClick={() => updateStatus('OVERDUE')}
        />
      </div>

      <Toolbar>
        <SearchField value={search} onChange={updateFilter(setSearch)} placeholder="Search tasks…" />
        <Select
          value={priority}
          onChange={updateFilter(setPriority)}
          placeholder="All priorities"
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
        />
        <div className="flex items-center gap-1.5">
          <Select value={sortBy} onChange={setSortBy} placeholder="Sort" options={SORT_OPTIONS} />
          <button
            type="button"
            onClick={() => setOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line bg-surface text-ink-muted transition-colors hover:border-route-200 hover:text-route-600"
            aria-label={order === 'ASC' ? 'Sort descending' : 'Sort ascending'}
            title={order === 'ASC' ? 'Ascending' : 'Descending'}
          >
            {order === 'ASC' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
          </button>
        </div>
      </Toolbar>

      <Card className="divide-y divide-line overflow-hidden p-0">
        {loading ? (
          <div className="divide-y divide-line">
            {[...Array(6)].map((_, i) => (
              <RowSkeleton key={i} delay={i * 50} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Try a different filter, or check back once work is assigned."
          />
        ) : (
          items.map((task, i) => (
            <div key={task.id} style={{ animation: `fade-in-up 0.35s ease-out ${Math.min(i * 35, 280)}ms both` }}>
              <TaskRow
                task={task}
                basePath={basePath}
                showAssignee={user.role !== ROLES.TEAM_MEMBER}
                viewerRole={user.role}
                viewerId={user.id}
              />
            </div>
          ))
        )}
      </Card>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {canCreate && (
        <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => refetch()} />
      )}
    </div>
  );
}
