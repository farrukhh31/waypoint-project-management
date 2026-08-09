import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useList } from '../../hooks/useList';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/roles';
import { TASK_STATUSES, TASK_STATUS_META, PRIORITIES, PRIORITY_META } from '../../config/statuses';
import PageHeader from '../../components/shared/PageHeader.jsx';
import { Toolbar, SearchField, Select } from '../../components/shared/Toolbar.jsx';
import Card from '../../components/ui/Card.jsx';
import TaskRow from '../../components/shared/TaskRow.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import TaskForm from '../../components/forms/TaskForm.jsx';

// At /pm/tasks a PM sees every task across their projects; at /team/tasks a
// Team Member only sees their own (the backend scopes this automatically
// from the JWT, so the query params are identical either way).
export default function Tasks({ basePath }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  // Lets the Topbar's "Create" shortcut (?new=1) open this form directly.
  useEffect(() => {
    if (searchParams.get('new') === '1' && user.role === ROLES.PROJECT_MANAGER) {
      setFormOpen(true);
      setSearchParams((params) => {
        params.delete('new');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, user.role]);

  // Lets dashboard shortcuts like "Needs your review" (?status=REVIEW) land
  // straight on a pre-filtered list instead of an unfiltered one.
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

  const { items, pagination, loading, refetch } = useList(
    '/tasks',
    'tasks',
    { search, status, priority, page },
    [search, status, priority, page]
  );

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={
          user.role === ROLES.PROJECT_MANAGER
            ? 'Tasks across every project you manage.'
            : 'Tasks assigned to you.'
        }
        action={
          user.role === ROLES.PROJECT_MANAGER && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          )
        }
      />

      <Toolbar>
        <SearchField value={search} onChange={updateFilter(setSearch)} placeholder="Search tasks…" />
        <Select
          value={status}
          onChange={updateFilter(setStatus)}
          placeholder="All statuses"
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_META[s].label }))}
        />
        <Select
          value={priority}
          onChange={updateFilter(setPriority)}
          placeholder="All priorities"
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
        />
      </Toolbar>

      <Card>
        {loading ? (
          <div className="flex flex-col gap-px p-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-line/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="Try a different filter, or check back once work is assigned."
          />
        ) : (
          <div className="divide-y divide-line">
            {items.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                basePath={basePath}
                showAssignee={user.role === ROLES.PROJECT_MANAGER}
                viewerRole={user.role}
                viewerId={user.id}
              />
            ))}
          </div>
        )}
      </Card>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {user.role === ROLES.PROJECT_MANAGER && (
        <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => refetch()} />
      )}
    </div>
  );
}
