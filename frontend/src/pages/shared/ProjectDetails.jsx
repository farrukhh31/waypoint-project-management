import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Pencil,
  Plus,
  X,
  MailPlus,
  ArrowLeft,
  Trash2,
  CalendarDays,
  ListChecks,
  AlignLeft,
  Percent,
  Users as UsersIcon,
  Send,
  MessageSquare,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ROLES, ROLE_HOME } from '../../config/roles';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import AvatarStack from '../../components/ui/AvatarStack.jsx';
import Button from '../../components/ui/Button.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import TaskRow from '../../components/shared/TaskRow.jsx';
import StatChip from '../../components/shared/StatChip.jsx';
import AddCardTile from '../../components/shared/AddCardTile.jsx';
import TeamChartModal from '../../components/shared/TeamChartModal.jsx';
import UserProfileModal from '../../components/shared/UserProfileModal.jsx';
import ActivityTimeline from '../../components/shared/ActivityTimeline.jsx';
import ReviewPanel from '../../components/shared/ReviewPanel.jsx';
import SubmissionModal from '../../components/shared/SubmissionModal.jsx';
import SubmissionPanel from '../../components/shared/SubmissionPanel.jsx';
import ProjectForm from '../../components/forms/ProjectForm.jsx';
import TaskForm from '../../components/forms/TaskForm.jsx';
import AddMembersModal from '../../components/forms/AddMembersModal.jsx';
import InviteForm from '../../components/forms/InviteForm.jsx';
import BlockedCompletionModal from '../../components/forms/BlockedCompletionModal.jsx';
import { PROJECT_STATUS_META, PRIORITY_META, PROJECT_STATUS_TONE } from '../../config/statuses';
import { formatDate, formatDueDate, timeElapsedPct } from '../../utils/formatDate';

export default function ProjectDetails({ tasksBasePath }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [blockedTasks, setBlockedTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamChartOpen, setTeamChartOpen] = useState(false);
  const [viewMemberId, setViewMemberId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user.role === ROLES.ADMIN;
  const canManage = isAdmin || project?.managerId === user.id;
  const isOwningPM = user.role === ROLES.PROJECT_MANAGER && project?.managerId === user.id;
  const canInvite =
    isAdmin || (user.role === ROLES.PROJECT_MANAGER && project?.managerId === user.id && user.canInviteMembers);
  // Same convention as basePath elsewhere ('/admin/projects', '/pm/projects',
  // '/team/projects') — derived from role rather than threaded through props,
  // since this page only receives tasksBasePath (which differs for PM/Team).
  const projectsBasePath = `${ROLE_HOME[user.role]}/projects`;

  const load = useCallback(async () => {
    const [projectRes, tasksRes, discussionsRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get('/tasks', { params: { projectId: id } }),
      api.get(`/projects/${id}/discussions`),
    ]);
    setProject(projectRes.data.data.project);
    setProgress(projectRes.data.data.progress);
    setTasks(tasksRes.data.data.tasks ?? []);
    setDiscussions(discussionsRes.data.data.messages ?? []);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    load()
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load this project.'))
      .finally(() => setLoading(false));
  }, [load]);

  async function refreshDiscussions() {
    const { data } = await api.get(`/projects/${id}/discussions`);
    setDiscussions(data.data.messages ?? []);
  }

  async function handleSubmitForApproval({ comment, attachments, links }) {
    try {
      const { data } = await api.post(`/projects/${id}/submit`, { comment, attachments, links });
      setProject(data.data.project);
      await refreshDiscussions();
    } catch (err) {
      if (err.response?.data?.details?.code === 'PROJECT_HAS_INCOMPLETE_TASKS') {
        setSubmitModalOpen(false);
        setBlockedTasks(err.response.data.details.incompleteTasks);
        return; // handled via the blocked-tasks modal instead of SubmissionModal's own error banner
      }
      throw err;
    }
  }

  async function handleApprove({ comment, attachments, links }) {
    const { data } = await api.post(`/projects/${id}/review`, { decision: 'approve', comment, attachments, links });
    setProject(data.data.project);
    await refreshDiscussions();
  }

  async function handleRequestChanges({ comment, attachments, links }) {
    const { data } = await api.post(`/projects/${id}/review`, {
      decision: 'request_changes',
      comment,
      attachments,
      links,
    });
    setProject(data.data.project);
    await refreshDiscussions();
  }

  async function handleUndoReview() {
    const { data } = await api.post(`/projects/${id}/review/undo`);
    setProject(data.data.project);
    await refreshDiscussions();
  }

  async function handleWithdrawSubmission() {
    const { data } = await api.post(`/projects/${id}/submit/undo`);
    setProject(data.data.project);
    await refreshDiscussions();
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/projects/${id}/discussions`, { message: comment });
      setComment('');
      await refreshDiscussions();
    } finally {
      setPosting(false);
    }
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm('Remove this person from the project?')) return;
    setRemovingId(memberId);
    try {
      const { data } = await api.delete(`/projects/${id}/members/${memberId}`);
      setProject(data.data.project);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      navigate(projectsBasePath, { replace: true });
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not delete this project.');
      setDeleting(false);
    }
  }

  if (loading) return <FullScreenLoader />;

  if (loadError || !project) {
    return (
      <EmptyState
        title="Couldn't load this project"
        description={loadError || 'Something went wrong loading this project.'}
        action={
          <Button
            size="sm"
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              load()
                .catch((err) => setLoadError(err.response?.data?.message || 'Could not load this project.'))
                .finally(() => setLoading(false));
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  const tone = PROJECT_STATUS_TONE[project.status] || PROJECT_STATUS_TONE.PLANNED;
  const progressPct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const timePct = timeElapsedPct(project.startDate, project.endDate);
  const dueLabel = formatDueDate(project.endDate);
  const isOverdue = dueLabel.includes('overdue') && project.status !== 'COMPLETED' && project.status !== 'CANCELLED';
  const teamSize = (project.members?.length ?? 0) + (project.manager ? 1 : 0);

  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  // Submission/approval history gets its own dedicated panel, separate
  // from free-form comments — mirrors the same split on the task detail
  // page (see components/shared/SubmissionPanel.jsx).
  const submissionEntries = discussions.filter((d) => d.kind && d.kind !== 'COMMENT');
  const commentEntries = discussions.filter((d) => !d.kind || d.kind === 'COMMENT');
  const commentParticipants = commentEntries.reduce((acc, d) => {
    if (d.author && !acc.some((p) => p.id === d.author.id)) acc.push(d.author);
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-5 animate-[fade-in-up_0.35s_ease-out]">
      <Link
        to={projectsBasePath}
        className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-route-600"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to projects
      </Link>

      {/* Hero */}
      <Card className="relative overflow-hidden p-0">
        <div
          className={clsx('pointer-events-none absolute inset-0 bg-gradient-to-br via-surface to-surface', tone.wash)}
          aria-hidden="true"
        />
        <div className={clsx('relative h-[3px] w-full', tone.bar)} />

        <div className="relative flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge meta={PROJECT_STATUS_META[project.status]} />
                <Badge meta={PRIORITY_META[project.priority]} />
              </div>
              <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{project.name}</h1>
            </div>

            {canManage && (
              <div className="flex shrink-0 items-center gap-2">
                {isOwningPM && (project.status === 'ACTIVE' || project.status === 'ON_HOLD') && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSubmitModalOpen(true)}
                    className="!border-sky-200 !bg-sky-50 !text-sky-700 hover:!bg-sky-100"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit for approval
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {isAdmin && (
                  <Button size="sm" variant="danger" onClick={handleDeleteProject} loading={deleting}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex gap-3 rounded-lg border border-line/70 bg-surface/70 p-4">
            <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            {project.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{project.description}</p>
            ) : (
              <p className="text-sm italic text-ink-muted">
                No description yet.{canManage && ' Add one from Edit to give the team more context.'}
              </p>
            )}
          </div>

          {/* Route timeline: dotted line with a pin at "today" */}
          <div className="flex flex-col gap-2">
            <div className="relative h-3" title={`${Math.round(timePct)}% of the timeline elapsed`}>
              <div className="route-line absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2" />
              <div
                className={clsx(
                  'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-surface transition-all duration-700',
                  tone.bar
                )}
                style={{ left: `${timePct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Started {formatDate(project.startDate)}
              </span>
              <span className={clsx('font-medium', isOverdue ? 'text-danger-600' : 'text-ink-soft')}>
                {dueLabel === '—' ? 'No due date' : dueLabel}
              </span>
              <span className="flex items-center gap-1.5">
                Due {formatDate(project.endDate)}
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip
              icon={ListChecks}
              label="Tasks completed"
              value={progress.total > 0 ? `${progress.completed} / ${progress.total}` : 'No tasks'}
            />
            <StatChip
              icon={Percent}
              label="Progress"
              value={`${progressPct}%`}
              tone="bg-accent-100 text-accent-600"
            />
            <StatChip
              icon={UsersIcon}
              label="Team size"
              value={teamSize}
              tone="bg-success-50 text-success-600"
              onClick={() => setTeamChartOpen(true)}
            />
            <StatChip
              icon={CalendarDays}
              label="Timeline"
              value={dueLabel === '—' ? '—' : dueLabel}
              tone={isOverdue ? 'bg-danger-50 text-danger-600' : 'bg-ink-muted/10 text-ink-soft'}
            />
          </div>
        </div>
      </Card>

      {/* Dedicated submission/approval record — separate from the
          free-form comments below. Visible to the owning PM, the Admin
          who approves it, and anyone else with project access (read-only). */}
      {submissionEntries.length > 0 && (
        <SubmissionPanel
          entries={submissionEntries}
          itemLabel="project"
          canUndo={isAdmin}
          onUndo={handleUndoReview}
          canWithdraw={isOwningPM}
          onWithdraw={handleWithdrawSubmission}
          reviewSlot={
            project.status === 'PENDING_APPROVAL' && isAdmin ? (
              <ReviewPanel
                title="This project was submitted for your approval"
                subtitle="Approve to mark it complete, or send it back with a comment explaining what needs to change."
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
              />
            ) : null
          }
          viewerNote={
            project.status === 'PENDING_APPROVAL' && !isAdmin ? (
              <p className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-sm text-sky-700">
                <Eye className="h-4 w-4 shrink-0" /> Submitted — awaiting approval from an Administrator.
              </p>
            ) : null
          }
        />
      )}

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <Card>
            <CardHeader>
              <h3 className="font-display text-base font-semibold text-ink">
                Tasks {tasks.length > 0 && <span className="text-ink-muted">({tasks.length})</span>}
              </h3>
              {canManage && (
                <Button
                  size="sm"
                  onClick={() => setTaskFormOpen(true)}
                  className="group !bg-gradient-to-r !from-route-500 !to-route-600 shadow-lg shadow-route-500/25 transition-all duration-200 hover:!from-route-600 hover:!to-route-700 hover:shadow-route-500/40 active:scale-95"
                >
                  <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" /> New task
                </Button>
              )}
            </CardHeader>
            <CardBody className={tasks.length === 0 ? undefined : 'p-0'}>
              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks in this project yet"
                  description={canManage ? 'Break the work down into tasks to start tracking progress.' : undefined}
                  action={
                    canManage && (
                      <Button size="sm" onClick={() => setTaskFormOpen(true)}>
                        <Plus className="h-4 w-4" /> Add the first task
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="divide-y divide-line">
                  {tasks.map((task, i) => (
                    <div key={task.id} style={{ animation: `fade-in-up 0.3s ease-out ${Math.min(i * 35, 300)}ms both` }}>
                      <TaskRow task={task} basePath={tasksBasePath} viewerRole={user.role} viewerId={user.id} />
                    </div>
                  ))}
                  {canManage && (
                    <div className="p-2.5">
                      <AddCardTile
                        dense
                        label="Add another task"
                        sublabel="Assign it, prioritize it, ship it"
                        onClick={() => setTaskFormOpen(true)}
                        className="border-line/70"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <MessageSquare className="h-4 w-4 text-ink-muted" /> Comments
              </h3>
              {commentParticipants.length > 0 && <AvatarStack people={commentParticipants} max={4} />}
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              {commentEntries.length === 0 ? (
                <EmptyState title="No comments yet" description="Start the conversation about this project below." />
              ) : (
                <ul className="flex flex-col gap-4">
                  {commentEntries.map((entry, i) => (
                    <li
                      key={entry.id}
                      className="group flex gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-paper"
                      style={{ animation: `fade-in-up 0.3s ease-out ${Math.min(i * 40, 320)}ms both` }}
                    >
                      <Avatar name={entry.author?.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-ink">{entry.author?.name}</span>
                          <span className="text-xs text-ink-muted">{formatDate(entry.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{entry.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handlePostComment} className="flex items-center gap-2 border-t border-line pt-4">
                <Avatar name={user.name} size="sm" />
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add to the discussion…"
                  className="h-10 flex-1 rounded border border-line bg-surface px-3 text-sm transition-shadow duration-150 focus:border-route-500 focus:outline-none focus:ring-2 focus:ring-route-500/20"
                />
                <Button
                  type="submit"
                  size="sm"
                  loading={posting}
                  disabled={!comment.trim()}
                  className="transition-transform duration-150 active:scale-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardBody>
          </Card>

          <ActivityTimeline projectId={id} />
        </div>

        <div className="flex w-full flex-col gap-5 lg:w-72">
          <Card>
            <CardHeader>
              <h3 className="font-display text-sm font-semibold text-ink">Progress</h3>
            </CardHeader>
            <CardBody className="flex items-center gap-4">
              <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0 -rotate-90">
                <circle cx="36" cy="36" r={ringRadius} fill="none" stroke="currentColor" strokeWidth="7" className="text-line" />
                <circle
                  cx="36"
                  cy="36"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className={clsx('transition-[stroke-dashoffset] duration-700', tone.ring)}
                />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-semibold tracking-tight text-ink">{progressPct}%</p>
                <p className="text-xs text-ink-muted">
                  {progress.completed} of {progress.total} tasks completed
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-display text-sm font-semibold text-ink">Manager</h3>
            </CardHeader>
            <CardBody>
              {project.manager ? (
                <button
                  type="button"
                  onClick={() => setViewMemberId(project.manager.id)}
                  className="group/row -mx-2 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-paper"
                >
                  <Avatar name={project.manager.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink group-hover/row:text-route-600">
                      {project.manager.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{project.manager.email}</p>
                  </div>
                </button>
              ) : (
                <p className="px-2 py-1 text-sm text-ink-muted">No manager assigned.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-display text-sm font-semibold text-ink">
                Team ({project.members?.length ?? 0})
              </h3>
              {canManage && (
                <div className="flex items-center gap-1.5">
                  {canInvite && (
                    <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)}>
                      <MailPlus className="h-3.5 w-3.5" /> Invite
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setAddMembersOpen(true)}>
                    Add
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardBody className="flex flex-col gap-1">
              {project.members?.length ? (
                project.members.map((member) => (
                  <div
                    key={member.id}
                    className="group/row -mx-2 flex items-center justify-between gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-paper"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMemberId(member.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <Avatar name={member.name} size="sm" />
                      <p className="truncate text-sm text-ink-soft group-hover/row:text-route-600">{member.name}</p>
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingId === member.id}
                        className="rounded p-1 text-ink-muted opacity-100 transition-opacity hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50 sm:opacity-0 sm:group-hover/row:opacity-100 sm:group-focus-within/row:opacity-100"
                        aria-label={`Remove ${member.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-2 py-1 text-sm text-ink-muted">No members added yet.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {canManage && (
        <>
          <ProjectForm
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => setProject(updated)}
            project={project}
            canReassignManager={isAdmin}
          />
          <TaskForm
            open={taskFormOpen}
            onClose={() => setTaskFormOpen(false)}
            onSaved={() => load()}
            fixedProjectId={project.id}
            fixedProjectName={project.name}
          />
          <AddMembersModal
            open={addMembersOpen}
            onClose={() => setAddMembersOpen(false)}
            onSaved={(updated) => setProject(updated)}
            projectId={project.id}
            existingMemberIds={project.members?.map((m) => m.id) ?? []}
          />
        </>
      )}

      {canInvite && (
        <InviteForm
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          fixedProjectId={project.id}
          fixedProjectName={project.name}
        />
      )}

      <TeamChartModal
        open={teamChartOpen}
        onClose={() => setTeamChartOpen(false)}
        project={project}
        tasks={tasks}
        canManage={canManage}
        onRemoveMember={handleRemoveMember}
        removingId={removingId}
        onSelectPerson={(personId) => setViewMemberId(personId)}
      />

      <UserProfileModal userId={viewMemberId} open={Boolean(viewMemberId)} onClose={() => setViewMemberId(null)} />

      <BlockedCompletionModal
        open={Boolean(blockedTasks)}
        onClose={() => setBlockedTasks(null)}
        projectName={project.name}
        tasks={blockedTasks || []}
        actionLabel="submitted for approval"
      />

      <SubmissionModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit for approval"
        subtitle="Add anything the Administrator should see — notes, files, or links to the finished work."
        submitLabel="Submit for approval"
        onSubmit={handleSubmitForApproval}
        context={[
          { label: 'Project', value: project.name },
          { label: 'Tasks', value: `${progress.completed}/${progress.total} done` },
          { label: 'Due', value: dueLabel === '—' ? formatDate(project.endDate) : dueLabel, tone: isOverdue ? 'warning' : 'default' },
          { label: 'Priority', value: PRIORITY_META[project.priority]?.label },
        ]}
      />
    </div>
  );
}