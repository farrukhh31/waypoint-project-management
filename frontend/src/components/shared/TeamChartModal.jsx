import { Crown, X, Mail, ListChecks } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../ui/Modal.jsx';
import Avatar from '../ui/Avatar.jsx';
import { ROLE_LABELS } from '../../config/roles';

// Per-person task breakdown within this project, derived from the same
// `tasks` list the page already loaded — no extra request needed.
function taskStatsFor(userId, tasks) {
  const assigned = tasks.filter((t) => t.assigneeId === userId);
  const completed = assigned.filter((t) => t.status === 'COMPLETED').length;
  const pct = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;
  return { total: assigned.length, completed, pct };
}

function PersonNode({ person, roleLabel, isManager = false, tasks, canRemove, onRemove, removing, onSelect, style }) {
  const stats = taskStatsFor(person.id, tasks);

  return (
    <div
      className={clsx(
        'group relative flex w-56 flex-col items-center gap-2 rounded-lg border bg-surface p-4 text-center shadow-card transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-pop',
        isManager ? 'border-accent-200 bg-gradient-to-b from-accent-50/60 to-surface' : 'border-line hover:border-route-200'
      )}
      style={style}
    >
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(person.id)}
          disabled={removing}
          aria-label={`Remove ${person.name}`}
          className="absolute right-2 top-2 rounded p-1 text-ink-muted opacity-0 transition-opacity hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* The whole card opens that person's profile — clicking a name in the
          org chart shouldn't dead-end; it should take you to who they are. */}
      <button
        type="button"
        onClick={() => onSelect?.(person.id)}
        className="flex w-full flex-col items-center gap-2 rounded-lg text-left"
      >
        <span className="relative">
          <Avatar name={person.name} size="lg" className="ring-2 ring-surface" />
          {isManager && (
            <Crown className="absolute -right-1.5 -top-2 h-4 w-4 rounded-full bg-accent-400 p-[2px] text-white" strokeWidth={2.5} />
          )}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink group-hover:text-route-600">{person.name}</p>
          <p className="flex items-center justify-center gap-1 truncate text-[11px] text-ink-muted">
            <Mail className="h-3 w-3 shrink-0" />
            {person.email}
          </p>
        </div>

        <span
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            isManager ? 'bg-accent-100 text-accent-700' : 'bg-route-100 text-route-700'
          )}
        >
          {roleLabel}
        </span>
      </button>

      <div className="flex w-full flex-col gap-1 border-t border-line pt-2.5">
        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3" />
            {stats.total > 0 ? `${stats.completed}/${stats.total} tasks` : 'No tasks assigned'}
          </span>
          {stats.total > 0 && <span className="font-medium text-ink-soft">{stats.pct}%</span>}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={clsx(
              'h-full rounded-full transition-[width] duration-700 ease-out',
              isManager ? 'bg-accent-400' : 'bg-route-500'
            )}
            style={{ width: `${stats.pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TeamChartModal({ open, onClose, project, tasks, canManage, onRemoveMember, removingId, onSelectPerson }) {
  if (!project) return null;
  const members = project.members || [];
  const teamSize = members.length + (project.manager ? 1 : 0);

  return (
    <Modal open={open} onClose={onClose} title={`${project.name} — Team`} className="max-w-3xl">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink-muted">
          {teamSize} {teamSize === 1 ? 'person' : 'people'} working on this project.
        </p>

        {!project.manager && members.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">No one has been added to this project yet.</p>
        ) : (
          <div className="flex flex-col items-center gap-0 overflow-x-auto pb-2">
            {project.manager && (
              <>
                <PersonNode
                  person={project.manager}
                  roleLabel="Project Manager"
                  isManager
                  tasks={tasks}
                  onSelect={onSelectPerson}
                  style={{ animation: 'fade-in-up 0.3s ease-out both' }}
                />
                {members.length > 0 && <div className="route-line-v h-8" aria-hidden="true" />}
              </>
            )}

            {members.length > 0 && (
              <div className="flex flex-wrap items-start justify-center gap-5">
                {members.map((member, i) => (
                  <div key={member.id} className="flex flex-col items-center gap-0">
                    {project.manager && <div className="route-line-v h-5" aria-hidden="true" />}
                    <PersonNode
                      person={member}
                      roleLabel={ROLE_LABELS[member.role] || 'Team Member'}
                      tasks={tasks}
                      canRemove={canManage}
                      onRemove={onRemoveMember}
                      removing={removingId === member.id}
                      onSelect={onSelectPerson}
                      style={{ animation: `fade-in-up 0.3s ease-out ${Math.min(i * 60, 300)}ms both` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
