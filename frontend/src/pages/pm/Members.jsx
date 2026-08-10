import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, FolderKanban, ListChecks, CheckCircle2, AlertTriangle, ArrowUpRight, Users2, Eye } from 'lucide-react';
import clsx from 'clsx';
import { useList } from '../../hooks/useList';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { ROLE_LABELS } from '../../config/roles';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import TiltCard from '../../components/ui/TiltCard.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import UserProfileModal from '../../components/shared/UserProfileModal.jsx';

// Same hue mapping UserCard/UserProfileModal use elsewhere, just the
// pieces this lighter read-only card actually needs (no edit/delete
// affordances — a PM can't manage users, only see their own roster).
const ROLE_TONE = {
  ADMIN: { bar: 'bg-danger-400', badge: 'bg-danger-50 text-danger-600', ring: 'ring-danger-300/60', wash: 'from-danger-50', border: 'group-hover:border-danger-200' },
  PROJECT_MANAGER: { bar: 'bg-route-500', badge: 'bg-route-100 text-route-700', ring: 'ring-route-300/60', wash: 'from-route-50', border: 'group-hover:border-route-200' },
  TEAM_MEMBER: { bar: 'bg-teal-400', badge: 'bg-teal-50 text-teal-700', ring: 'ring-teal-300/60', wash: 'from-teal-50', border: 'group-hover:border-teal-200' },
};

// Builds one roster row per unique person across every project this PM
// manages, folding in their task load from the (already PM-scoped) task
// list — no separate org-wide user fetch, so the roster can never show
// anyone outside this PM's own projects.
function buildRoster(projects, tasks) {
  const roster = new Map();

  projects.forEach((project) => {
    (project.members || []).forEach((member) => {
      if (!roster.has(member.id)) {
        roster.set(member.id, { ...member, projects: new Map(), total: 0, completed: 0, overdue: 0, inProgress: 0 });
      }
      roster.get(member.id).projects.set(project.id, project.name);
    });
  });

  const now = new Date();
  tasks.forEach((task) => {
    const assignee = task.assignee;
    if (!assignee || !roster.has(assignee.id)) return;
    const row = roster.get(assignee.id);
    row.total += 1;
    if (task.status === 'COMPLETED') row.completed += 1;
    else if (task.dueDate && new Date(task.dueDate) < now) row.overdue += 1;
    else if (task.status === 'IN_PROGRESS' || task.status === 'REVIEW') row.inProgress += 1;
  });

  return Array.from(roster.values())
    .map((row) => ({ ...row, projects: Array.from(row.projects, ([id, name]) => ({ id, name })) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// The whole card opens that person's profile (same UserProfileModal Admin's
// Users page uses — bio, contact info, role, member since) since that's
// what "My Team" is for: who they are. Progress/workload stays as its own
// explicit, stop-propagation link into Member Reports rather than living
// behind the same click — the two pages answer different questions.
// Memoized since the roster can run into dozens of people across a PM's
// projects — a search keystroke re-filters the list, but shouldn't
// re-render every card that didn't change.
const MemberCard = memo(function MemberCard({ member, onView, revealDelay }) {
  const [revealRef, revealed] = useScrollReveal();
  const tone = ROLE_TONE[member.role] || ROLE_TONE.TEAM_MEMBER;
  const pct = member.total ? Math.round((member.completed / member.total) * 100) : 0;
  const visibleProjects = member.projects.slice(0, 2);
  const extraProjects = member.projects.length - visibleProjects.length;

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView(member.id);
    }
  }

  return (
    <div
      ref={revealRef}
      style={{ transitionDelay: revealed ? `${revealDelay}ms` : '0ms' }}
      className={clsx(
        'h-full transition-all duration-500 ease-out',
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <TiltCard maxTilt={4} className="block h-full rounded-lg">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onView(member.id)}
          onKeyDown={handleKeyDown}
          aria-label={`View ${member.name}'s profile`}
          className={clsx(
            'card-sheen group relative flex h-full cursor-pointer flex-col overflow-hidden p-0 outline-none transition-all duration-300',
            'hover:-translate-y-1.5 focus-visible:-translate-y-1.5',
            tone.border
          )}
        >
          {/* Quiet role-tinted wash that blooms in on hover, same touch as UserCard */}
          <div
            className={clsx(
              'pointer-events-none absolute inset-0 bg-gradient-to-br via-surface to-surface opacity-0 transition-opacity duration-300 group-hover:opacity-100',
              tone.wash
            )}
            aria-hidden="true"
          />

          <div className={clsx('relative h-[3px] w-full shrink-0', tone.bar)} />
          <div className="relative flex flex-1 flex-col gap-4 p-5">
            <div className="flex items-start gap-3">
              <Avatar
                name={member.name}
                src={member.avatarUrl}
                size="lg"
                className={clsx(
                  'h-12 w-12 shrink-0 ring-2 ring-offset-2 ring-offset-surface transition-transform duration-300 group-hover:scale-105',
                  tone.ring
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-ink transition-colors duration-200 group-hover:text-route-700">
                  {member.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-muted">
                  <Mail className="h-3 w-3 shrink-0" />
                  {member.email}
                </p>
                <span className={clsx('mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', tone.badge)}>
                  {ROLE_LABELS[member.role] || member.role}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {visibleProjects.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft transition-colors duration-200 group-hover:border-route-200/70"
                >
                  <FolderKanban className="h-3 w-3 text-ink-muted" />
                  {p.name}
                </span>
              ))}
              {extraProjects > 0 && (
                <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                  +{extraProjects} more
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-line bg-surface py-2 transition-colors duration-200 group-hover:border-line/70">
                <p className="font-display text-sm font-semibold text-ink">{member.total}</p>
                <p className="text-[10px] text-ink-muted">Assigned</p>
              </div>
              <div className="rounded-lg border border-line bg-surface py-2 transition-colors duration-200 group-hover:border-line/70">
                <p className="font-display text-sm font-semibold text-success-600">{member.completed}</p>
                <p className="text-[10px] text-ink-muted">Done</p>
              </div>
              <div className="rounded-lg border border-line bg-surface py-2 transition-colors duration-200 group-hover:border-line/70">
                <p className={clsx('font-display text-sm font-semibold', member.overdue > 0 ? 'text-danger-600' : 'text-ink')}>
                  {member.overdue}
                </p>
                <p className="text-[10px] text-ink-muted">Overdue</p>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-ink-muted">
                <span>Completion</span>
                <span className="font-medium text-ink-soft">{pct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-route-400 to-route-500 shadow-sm transition-all duration-700 ease-out"
                  style={{ width: revealed ? `${pct}%` : '0%' }}
                />
              </div>
            </div>

            <Link
              to={`/pm/reports/team?member=${member.id}`}
              onClick={(e) => e.stopPropagation()}
              className="group/link mt-auto flex items-center justify-center gap-1 rounded-lg border border-dashed border-line py-2 text-xs font-medium text-ink-muted transition-colors hover:border-route-300 hover:text-route-600"
            >
              Progress report
              <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover/link:translate-x-0.5" />
            </Link>

            {/* "View profile" affordance — same slide-up-on-hover pattern as
                Admin's UserCard, signalling the card itself is clickable.
                Hidden on touch devices (no hover state to trigger it) so
                it never sits mid-animation on mobile. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center gap-1.5 bg-gradient-to-t from-surface via-surface/95 to-transparent pb-2.5 pt-6 text-xs font-medium text-route-600 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
              <Eye className="h-3 w-3" />
              View profile
            </div>
          </div>
        </Card>
      </TiltCard>
    </div>
  );
});

// A read-only roster of everyone working across this PM's own projects —
// the "who's on my team" directory that Admin's Users page covers
// org-wide, scoped down to just this PM's people. Clicking someone opens
// their profile (who they are); the separate "Progress report" link goes
// to the deeper per-member stats page (how they're doing).
export default function Members() {
  const { items: projects, loading: projectsLoading } = useList('/projects', 'projects', { limit: 100 });
  const { items: tasks, loading: tasksLoading } = useList('/tasks', 'tasks', { limit: 200 });
  const [search, setSearch] = useState('');
  const [viewMemberId, setViewMemberId] = useState(null);

  const loading = projectsLoading || tasksLoading;
  // Both lists are already scoped server-side to this PM's projects and
  // fetched in parallel by their own hooks — the roster is a pure,
  // memoized client-side fold over data already in memory, so filtering
  // as the person types never touches the network.
  const roster = useMemo(() => buildRoster(projects, tasks), [projects, tasks]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [roster, search]);

  const totalAssigned = roster.reduce((sum, m) => sum + m.total, 0);
  const totalCompleted = roster.reduce((sum, m) => sum + m.completed, 0);
  const totalOverdue = roster.reduce((sum, m) => sum + m.overdue, 0);
  const teamCompletionRate = totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <Reveal>
        <PageHeader title="My Team" description="Everyone working across your projects — tap a card to see their profile." />
      </Reveal>

      <Reveal delay={40} className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Team members" value={roster.length} icon={Users2} accent="teal" tilt />
        <StatCard label="Tasks assigned" value={totalAssigned} icon={ListChecks} accent="route" tilt />
        <StatCard label="Completion rate" value={`${teamCompletionRate}%`} icon={CheckCircle2} accent="success" tilt />
        <StatCard label="Overdue" value={totalOverdue} icon={AlertTriangle} accent="danger" tilt />
      </Reveal>

      <Reveal delay={80}>
        <Input
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="mb-5 w-full sm:max-w-xs"
        />
      </Reveal>

      {roster.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Once you add members to a project, they'll show up here with their workload."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try a different name or email." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member, i) => (
            <MemberCard key={member.id} member={member} onView={setViewMemberId} revealDelay={Math.min(i * 60, 420)} />
          ))}
        </div>
      )}

      <UserProfileModal userId={viewMemberId} open={Boolean(viewMemberId)} onClose={() => setViewMemberId(null)} />
    </div>
  );
}
