import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Users,
  Flame,
  ListChecks,
  UserCheck,
  Gauge,
  ChevronDown,
  FolderKanban,
  Briefcase,
} from 'lucide-react';
import api from '../../lib/api';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import TiltCard from '../../components/ui/TiltCard.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import UserProfileModal from '../../components/shared/UserProfileModal.jsx';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { TASK_STATUS_META, PROJECT_STATUS_META } from '../../config/statuses';

// Three load bands rather than one flat brand-colored bar — a person
// sitting on 6 active tasks should visually read as "hot" at a glance,
// not just "a slightly longer version of everyone else's bar".
function loadBand(ratio) {
  if (ratio >= 0.7) {
    return {
      key: 'heavy',
      bar: 'from-danger-400 to-danger-600',
      ring: 'ring-danger-300/60',
      border: 'group-hover:border-danger-200',
      glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(240,50,75,0.35)]',
      wash: 'from-danger-50',
      chip: 'bg-danger-50 text-danger-600',
    };
  }
  if (ratio >= 0.35) {
    return {
      key: 'moderate',
      bar: 'from-accent-400 to-accent-500',
      ring: 'ring-accent-300/60',
      border: 'group-hover:border-accent-200',
      glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(255,140,26,0.35)]',
      wash: 'from-accent-50',
      chip: 'bg-accent-50 text-accent-700',
    };
  }
  return {
    key: 'light',
    bar: 'from-teal-400 to-teal-600',
    ring: 'ring-teal-300/60',
    border: 'group-hover:border-teal-200',
    glow: 'group-hover:shadow-[0_18px_40px_-12px_rgba(20,201,165,0.35)]',
    wash: 'from-teal-50',
    chip: 'bg-teal-50 text-teal-700',
  };
}

function ProjectChip({ project }) {
  const meta = PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.PLANNED;
  return (
    <Link
      to={`/admin/projects/${project.id}`}
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-transform duration-150 hover:scale-105',
        meta.className
      )}
    >
      <FolderKanban className="h-2.5 w-2.5" />
      {project.name}
    </Link>
  );
}

// One card, two shapes: a Team Member shows their own assigned tasks
// grouped by project; a Project Manager shows the projects they run with
// each one's completion — both share the same load-bar/expand chrome so
// the two sections read as one consistent system rather than bolted
// together.
function WorkloadCard({ person, kind, counts, active, maxActive, projects, index, onView }) {
  const ratio = maxActive ? active / maxActive : 0;
  const tone = loadBand(ratio);
  const [revealRef, revealed] = useScrollReveal();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      ref={revealRef}
      style={{ transitionDelay: `${Math.min(index * 60, 420)}ms` }}
      className={clsx(
        'transition-all duration-500 ease-out',
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <TiltCard maxTilt={3} className="block h-full rounded-lg">
        <Card
          className={clsx(
            'card-sheen group relative h-full overflow-hidden p-4 transition-all duration-300',
            'hover:-translate-y-1',
            tone.border,
            tone.glow
          )}
        >
          {/* Quiet load-tinted wash that blooms in on hover */}
          <div
            className={clsx(
              'pointer-events-none absolute inset-0 bg-gradient-to-br via-surface to-surface opacity-0 transition-opacity duration-300 group-hover:opacity-100',
              tone.wash
            )}
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={() => onView(person)}
            className="relative mb-3 flex w-full items-center gap-2.5 text-left"
            aria-label={`View ${person.name}'s profile`}
          >
            <div className={clsx('rounded-full ring-2 ring-offset-2 ring-offset-surface transition-transform duration-300 group-hover:scale-110', tone.ring)}>
              <Avatar name={person.name} src={person.avatarUrl} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink transition-colors duration-200 group-hover:text-route-700">
                {person.name}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
                {kind === 'manager' && <Briefcase className="h-2.5 w-2.5 shrink-0" />}
                {person.jobTitle || (kind === 'manager' ? 'Project Manager' : 'Team member')}
              </p>
            </div>
          </button>

          <div className="relative mb-2 h-2 w-full overflow-hidden rounded-full bg-paper">
            <div
              className={clsx(
                'h-full rounded-full bg-gradient-to-r bg-[length:200%_100%] transition-[width] duration-700 ease-out',
                tone.bar,
                active > 0 && 'animate-border-shimmer'
              )}
              style={{ width: `${Math.max(ratio * 100, active > 0 ? 6 : 0)}%` }}
            />
          </div>
          <div className="relative mb-3 flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              {active} active task{active === 1 ? '' : 's'}
              {kind === 'manager' && projects.length > 0 && ` · ${projects.length} project${projects.length === 1 ? '' : 's'}`}
            </p>
            {tone.key === 'heavy' && active > 0 && (
              <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', tone.chip)}>
                <Flame className="h-2.5 w-2.5" /> Overloaded
              </span>
            )}
          </div>

          {kind === 'member' && (
            <div className="relative mb-3 flex flex-wrap gap-1.5">
              {Object.entries(counts).map(([status, count]) =>
                count > 0 ? (
                  <span
                    key={status}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-transform duration-200 group-hover:scale-105 ${TASK_STATUS_META[status].className}`}
                  >
                    {count} {TASK_STATUS_META[status].label}
                  </span>
                ) : null
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="relative flex w-full items-center justify-center gap-1 rounded-md border border-line/70 bg-paper/50 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink"
          >
            {expanded ? 'Hide' : kind === 'manager' ? 'Show projects' : 'Show projects & tasks'}
            <ChevronDown className={clsx('h-3 w-3 transition-transform duration-300', expanded && 'rotate-180')} />
          </button>

          {/* Modern CSS-grid accordion — animates smoothly without measuring
              pixel heights in JS. */}
          <div
            className={clsx(
              'relative grid transition-[grid-template-rows] duration-300 ease-out',
              expanded ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'
            )}
          >
            <div className="overflow-hidden">
              {projects.length === 0 ? (
                <p className="text-xs text-ink-muted">Not on any projects yet.</p>
              ) : kind === 'manager' ? (
                <ul className="flex flex-col gap-2">
                  {projects.map((p) => {
                    const pct = p.progress.total ? Math.round((p.progress.completed / p.progress.total) * 100) : 0;
                    return (
                      <li key={p.id} className="rounded-lg border border-line/70 bg-paper/40 p-2.5">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <ProjectChip project={p} />
                          <span className="shrink-0 text-[10px] text-ink-muted">{p.teamSize} on team</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                            <div className="h-full rounded-full bg-route-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="shrink-0 text-[10px] text-ink-muted">
                            {p.progress.completed}/{p.progress.total} done
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="flex flex-col gap-2">
                  {projects.map((p) => (
                    <li key={p.id} className="rounded-lg border border-line/70 bg-paper/40 p-2.5">
                      <div className="mb-1.5">
                        <ProjectChip project={p} />
                      </div>
                      <ul className="flex flex-col gap-1">
                        {p.tasks.map((t) => (
                          <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="min-w-0 truncate text-ink-soft">{t.title}</span>
                            <span
                              className={clsx(
                                'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                                TASK_STATUS_META[t.status].className
                              )}
                            >
                              {TASK_STATUS_META[t.status].label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </TiltCard>
    </div>
  );
}

function WorkloadGrid({ people, kind, onView }) {
  if (people.length === 0) {
    return (
      <EmptyState
        title={kind === 'manager' ? 'No project managers yet' : 'No team members yet'}
        description={kind === 'manager' ? 'Invite a project manager to see their portfolio here.' : 'Invite team members to see workload here.'}
      />
    );
  }
  const maxActive = Math.max(...people.map((p) => p.active), 1);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {people
        .sort((a, b) => b.active - a.active)
        .map(({ person, counts, active, projects }, i) => (
          <WorkloadCard
            key={person.id}
            person={person}
            kind={kind}
            counts={counts}
            active={active}
            maxActive={maxActive}
            projects={projects}
            index={i}
            onView={(p) => onView(p.id)}
          />
        ))}
    </div>
  );
}

// Groups every team member's assigned tasks (by project) and every project
// manager's portfolio into an at-a-glance load view — a bar per person
// rather than a raw count table, expandable to the actual projects/tasks
// behind that number.
export default function TeamWorkload() {
  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMemberId, setViewMemberId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/users', { params: { role: 'TEAM_MEMBER', limit: 200 } }),
      api.get('/users', { params: { role: 'PROJECT_MANAGER', limit: 200 } }),
      api.get('/tasks', { params: { limit: 200 } }),
      api.get('/projects', { params: { limit: 200 } }),
    ]).then(([membersRes, managersRes, tasksRes, projectsRes]) => {
      if (cancelled) return;
      setMembers(membersRes.data.data.users);
      setManagers(managersRes.data.data.users);
      setTasks(tasksRes.data.data.tasks);
      setProjects(projectsRes.data.data.projects);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <FullScreenLoader />;

  const byMember = members.map((member) => {
    const assigned = tasks.filter((t) => t.assignee?.id === member.id);
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
    assigned.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    const active = assigned.length - counts.COMPLETED;

    // Group this member's tasks by the project they belong to, so the
    // expanded view answers "which project, which task" directly rather
    // than just a status-count breakdown.
    const byProject = new Map();
    assigned.forEach((t) => {
      if (!t.project) return;
      if (!byProject.has(t.project.id)) byProject.set(t.project.id, { ...t.project, tasks: [] });
      byProject.get(t.project.id).tasks.push({ id: t.id, title: t.title, status: t.status });
    });

    return { person: member, counts, active, projects: Array.from(byProject.values()) };
  });

  const byManager = managers.map((manager) => {
    const owned = projects.filter((p) => p.manager?.id === manager.id);
    const active = owned.reduce((sum, p) => sum + (p.progress.total - p.progress.completed), 0);
    const managerProjects = owned.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      teamSize: (p.members?.length ?? 0) + 1,
    }));
    return { person: manager, counts: null, active, projects: managerProjects };
  });

  const maxActiveMembers = Math.max(...byMember.map((m) => m.active), 1);
  const totalActive = byMember.reduce((sum, m) => sum + m.active, 0);
  const overloadedCount = byMember.filter((m) => m.active / maxActiveMembers >= 0.7 && m.active > 0).length;
  const idleCount = byMember.filter((m) => m.active === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Team members" value={byMember.length} icon={Users} accent="route" tilt />
        <StatCard label="Active tasks" value={totalActive} icon={ListChecks} accent="sky" tilt />
        <StatCard label="Overloaded" value={overloadedCount} icon={Flame} accent="danger" tilt />
        <StatCard label="Fully idle" value={idleCount} icon={UserCheck} accent="teal" tilt />
      </div>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Team workload</h3>
            <p className="text-xs text-ink-muted">Active (non-completed) task load per team member, by project</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Gauge className="h-3.5 w-3.5" /> Sorted by heaviest load
          </span>
        </CardHeader>
        <CardBody>
          <WorkloadGrid people={byMember} kind="member" onView={setViewMemberId} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Project managers</h3>
            <p className="text-xs text-ink-muted">Portfolio load — open tasks across every project each PM runs</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Briefcase className="h-3.5 w-3.5" /> {byManager.length} manager{byManager.length === 1 ? '' : 's'}
          </span>
        </CardHeader>
        <CardBody>
          <WorkloadGrid people={byManager} kind="manager" onView={setViewMemberId} />
        </CardBody>
      </Card>

      <UserProfileModal userId={viewMemberId} open={Boolean(viewMemberId)} onClose={() => setViewMemberId(null)} />
    </div>
  );
}