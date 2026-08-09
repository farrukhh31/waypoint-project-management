import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  LayoutGrid,
  List as ListIcon,
  ArrowDownAZ,
  ArrowUpAZ,
  FolderKanban,
  Rocket,
  CheckCircle2,
  PauseCircle,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import { useList } from '../../hooks/useList';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/roles';
import { PROJECT_STATUSES, PROJECT_STATUS_META, PRIORITIES, PRIORITY_META, PROJECT_STATUS_TONE } from '../../config/statuses';
import PageHeader from '../../components/shared/PageHeader.jsx';
import { Toolbar, SearchField, Select } from '../../components/shared/Toolbar.jsx';
import ProjectCard from '../../components/shared/ProjectCard.jsx';
import ProjectListRow from '../../components/shared/ProjectListRow.jsx';
import AddCardTile from '../../components/shared/AddCardTile.jsx';
import Card from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ProjectForm from '../../components/forms/ProjectForm.jsx';

const STATUS_DOT = Object.fromEntries(Object.entries(PROJECT_STATUS_TONE).map(([k, v]) => [k, v.bar]));

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'endDate', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
];

function StatusPill({ label, count, dot, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
        active
          ? 'border-route-500 bg-route-500 text-white shadow-pop'
          : 'border-line bg-surface text-ink-soft hover:-translate-y-0.5 hover:border-route-200 hover:bg-route-50 hover:text-route-700 hover:shadow-card'
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', active ? 'bg-white' : dot)} />}
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

function CardSkeleton({ delay }) {
  return (
    <div
      className="flex h-[268px] flex-col gap-4 rounded-lg border border-line bg-surface p-5 animate-[fade-in-up_0.4s_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 animate-pulse rounded-full bg-line" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-line" />
      </div>
      <div className="h-3 w-full animate-pulse rounded bg-line" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-line" />
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-line" />
        <div className="flex justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-line" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-line" />
        </div>
      </div>
    </div>
  );
}

// Route-relative: rendered at /admin/projects, /pm/projects, /team/projects.
// basePath decides where a card links; only Admins get "New project" here —
// PMs manage projects the admin already assigned them, per the spec.
export default function Projects({ basePath }) {
  const { user } = useAuth();
  const isAdmin = user.role === ROLES.ADMIN;
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => searchParams.get('status') || '');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('DESC');
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Lets the Topbar's "Create" shortcut (?new=1) open this form directly,
  // instead of the person having to land here and hunt for the button.
  useEffect(() => {
    if (searchParams.get('new') === '1' && isAdmin) {
      setFormOpen(true);
      setSearchParams((params) => {
        params.delete('new');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, isAdmin]);

  const { items, pagination, meta, loading, refetch } = useList(
    '/projects',
    'projects',
    { search, status, priority, sortBy, order, page },
    [search, status, priority, sortBy, order, page]
  );

  const statusCounts = meta?.statusCounts || {};
  const totalCount = useMemo(
    () => PROJECT_STATUSES.reduce((sum, s) => sum + (statusCounts[s] || 0), 0),
    [statusCounts]
  );

  function updateStatus(value) {
    setStatus((current) => (current === value ? '' : value));
    setPage(1);
  }

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function updatePriority(value) {
    setPriority(value);
    setPage(1);
  }

  function openCreate() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEdit(project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeletingId(project.id);
    try {
      await api.delete(`/projects/${project.id}`);
      refetch();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not delete this project.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-route-500 text-white shadow-lg shadow-route-500/30">
              <FolderKanban className="h-4 w-4" strokeWidth={2.25} />
            </span>
            Projects
          </span>
        }
        description={
          isAdmin ? 'Every project across the organization.' : 'Projects you currently belong to.'
        }
        action={
          isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          )
        }
      />

      {/* At-a-glance overview — same StatCard used on the dashboards, so the
          Projects section gets a premium summary strip for free. */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total projects" value={totalCount} icon={Layers} accent="route" tilt />
        <StatCard label="Active" value={statusCounts.ACTIVE || 0} icon={Rocket} accent="accent" tilt />
        <StatCard label="Completed" value={statusCounts.COMPLETED || 0} icon={CheckCircle2} accent="success" tilt />
        <StatCard label="On hold" value={statusCounts.ON_HOLD || 0} icon={PauseCircle} accent="danger" tilt />
      </div>

      {/* Status filter pills, doubling as a live breakdown */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill label="All" count={totalCount} active={status === ''} onClick={() => updateStatus('')} />
        {PROJECT_STATUSES.map((s) => (
          <StatusPill
            key={s}
            label={PROJECT_STATUS_META[s].label}
            count={statusCounts[s]}
            dot={STATUS_DOT[s]}
            active={status === s}
            onClick={() => updateStatus(s)}
          />
        ))}
      </div>

      <Toolbar>
        <SearchField value={search} onChange={updateSearch} placeholder="Search projects…" />
        <Select
          value={priority}
          onChange={updatePriority}
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

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              view === 'grid' ? 'bg-route-500 text-white shadow-card' : 'text-ink-muted hover:text-ink'
            )}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              view === 'list' ? 'bg-route-500 text-white shadow-card' : 'text-ink-muted hover:text-ink'
            )}
            aria-label="List view"
            aria-pressed={view === 'list'}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </Toolbar>

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} delay={i * 60} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col gap-px p-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-line/40" />
            ))}
          </Card>
        )
      ) : items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={
            isAdmin
              ? 'Create the first project to get the team moving.'
              : "You'll see projects here once you're added to one."
          }
          action={
            isAdmin && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <AddCardTile
              label="New project"
              sublabel="Kick off the next initiative"
              onClick={openCreate}
              className="animate-[fade-in-up_0.4s_ease-out_both]"
            />
          )}
          {items.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              basePath={basePath}
              canManage={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              style={{ animation: `fade-in-up 0.4s ease-out ${Math.min(i * 45, 360)}ms both` }}
            />
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-line overflow-hidden p-0">
          {items.map((project) => (
            <div
              key={project.id}
              className={clsx('relative', deletingId === project.id && 'pointer-events-none opacity-50')}
            >
              <ProjectListRow
                project={project}
                basePath={basePath}
                canManage={isAdmin}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </Card>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      {isAdmin && (
        <ProjectForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={() => refetch()}
          project={editingProject}
          canReassignManager
        />
      )}
    </div>
  );
}
