import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  Flag,
  UserCircle2,
  Milestone,
  Link2,
  ShieldAlert,
  MessageSquare,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/roles';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import AvatarStack from '../../components/ui/AvatarStack.jsx';
import StatusTracker from '../../components/ui/StatusTracker.jsx';
import Button from '../../components/ui/Button.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatChip from '../../components/shared/StatChip.jsx';
import ReviewPanel from '../../components/shared/ReviewPanel.jsx';
import SubmissionModal from '../../components/shared/SubmissionModal.jsx';
import SubmissionPanel from '../../components/shared/SubmissionPanel.jsx';
import TaskForm from '../../components/forms/TaskForm.jsx';
import { PRIORITY_META, TASK_STATUS_META } from '../../config/statuses';
import { formatDate, formatDueDate, getDeadlineUrgency } from '../../utils/formatDate';

// Same "tone" idea as PROJECT_STATUS_TONE (config/statuses.js) but for a
// task's own status — drives the hero gradient wash and the progress ring
// so the page reads as one family with the project detail page.
const TASK_STATUS_TONE = {
  TODO: { bar: 'bg-ink-muted', wash: 'from-ink-muted/5', ring: 'text-ink-muted' },
  IN_PROGRESS: { bar: 'bg-route-500', wash: 'from-route-50', ring: 'text-route-500' },
  REVIEW: { bar: 'bg-accent-400', wash: 'from-accent-50', ring: 'text-accent-400' },
  COMPLETED: { bar: 'bg-success-400', wash: 'from-success-50', ring: 'text-success-400' },
};

const PRIORITY_FLAG = {
  LOW: 'text-ink-muted',
  MEDIUM: 'text-route-500',
  HIGH: 'text-accent-500',
  URGENT: 'text-danger-400',
};

function DependencyChip({ task, basePath }) {
  const dot = {
    TODO: 'bg-ink-muted',
    IN_PROGRESS: 'bg-route-500',
    REVIEW: 'bg-accent-400',
    COMPLETED: 'bg-success-400',
  }[task.status];

  return (
    <Link
      to={`${basePath}/${task.id}`}
      className="group flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-route-200 hover:bg-route-50 hover:text-route-700 hover:shadow-card"
    >
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
      <span className="max-w-[14rem] truncate">{task.title}</span>
    </Link>
  );
}

export default function TaskDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const [taskRes, discussionsRes] = await Promise.all([
      api.get(`/tasks/${id}`),
      api.get(`/tasks/${id}/discussions`),
    ]);
    setTask(taskRes.data.data.task);
    setDiscussions(discussionsRes.data.data.messages ?? []);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleStatusChange(nextStatus) {
    if (nextStatus === task.status) return;
    setUpdatingStatus(true);
    try {
      const { data } = await api.patch(`/tasks/${id}/status`, { status: nextStatus });
      setTask(data.data.task);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSubmitForReview({ comment, attachments, links }) {
    const { data } = await api.post(`/tasks/${id}/submit`, { comment, attachments, links });
    setTask(data.data.task);
    const { data: discussionsData } = await api.get(`/tasks/${id}/discussions`);
    setDiscussions(discussionsData.data.messages ?? []);
  }

  async function handleApprove({ comment, attachments, links }) {
    const { data } = await api.post(`/tasks/${id}/review`, { decision: 'approve', comment, attachments, links });
    setTask(data.data.task);
    const { data: discussionsData } = await api.get(`/tasks/${id}/discussions`);
    setDiscussions(discussionsData.data.messages ?? []);
  }

  async function handleRequestChanges({ comment, attachments, links }) {
    const { data } = await api.post(`/tasks/${id}/review`, {
      decision: 'request_changes',
      comment,
      attachments,
      links,
    });
    setTask(data.data.task);
    const { data: discussionsData } = await api.get(`/tasks/${id}/discussions`);
    setDiscussions(discussionsData.data.messages ?? []);
  }

  async function handleUndoReview() {
    const { data } = await api.post(`/tasks/${id}/review/undo`);
    setTask(data.data.task);
    const { data: discussionsData } = await api.get(`/tasks/${id}/discussions`);
    setDiscussions(discussionsData.data.messages ?? []);
  }

  async function handleWithdrawSubmission() {
    const { data } = await api.post(`/tasks/${id}/submit/undo`);
    setTask(data.data.task);
    const { data: discussionsData } = await api.get(`/tasks/${id}/discussions`);
    setDiscussions(discussionsData.data.messages ?? []);
  }

  async function handleDeleteTask() {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${id}`);
      navigate(-1);
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not delete this task.');
      setDeleting(false);
    }
  }

  async function handlePostComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tasks/${id}/discussions`, { message: comment });
      setComment('');
      const { data } = await api.get(`/tasks/${id}/discussions`);
      setDiscussions(data.data.messages ?? []);
    } finally {
      setPosting(false);
    }
  }

  if (loading || !task) return <FullScreenLoader />;

  const tone = TASK_STATUS_TONE[task.status] || TASK_STATUS_TONE.TODO;
  const isAdmin = user.role === ROLES.ADMIN;
  const isOwningPM = user.role === ROLES.PROJECT_MANAGER && task.project?.managerId === user.id;
  const canManage = isAdmin || isOwningPM;
  const isAssignee = task.assigneeId === user.id;
  // Day-to-day TODO/IN_PROGRESS moves belong to the assignee or the owning
  // PM. Entering REVIEW happens via "Submit for review", and leaving it
  // (approve/request changes) is the owning PM's call — see the review
  // panel below.
  const canToggleWorkStatus = (isAssignee || isOwningPM) && (task.status === 'TODO' || task.status === 'IN_PROGRESS');
  const canSubmitForReview = isAssignee && (task.status === 'TODO' || task.status === 'IN_PROGRESS');
  const awaitingReview = task.status === 'REVIEW';
  const dueLabel = formatDueDate(task.dueDate);
  const dueUrgency = getDeadlineUrgency(task.dueDate, task.status);
  const isOverdue = dueUrgency === 'overdue';
  const isDueSoon = dueUrgency === 'soon';
  const progressPct = Math.max(0, Math.min(100, task.progress ?? 0));
  const portalRoot = window.location.pathname.split('/tasks/')[0];
  const tasksBasePath = `${portalRoot}/tasks`;
  const projectLink = `${portalRoot}/projects/${task.projectId}`;

  const ringRadius = 30;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  // Submission/review history (submit, approve, request changes) gets its
  // own dedicated panel below the hero — pulled out of the free-form
  // discussion thread so it reads as a proper record. Comments stay in
  // the Discussion card further down.
  const submissionEntries = discussions.filter((d) => d.kind && d.kind !== 'COMMENT');
  const commentEntries = discussions.filter((d) => !d.kind || d.kind === 'COMMENT');
  const commentParticipants = commentEntries.reduce((acc, d) => {
    if (d.author && !acc.some((p) => p.id === d.author.id)) acc.push(d.author);
    return acc;
  }, []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 animate-[fade-in-up_0.35s_ease-out]">
      <Link
        to={projectLink}
        className="group inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-route-600"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to {task.project?.name || 'project'}
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
                <Badge meta={TASK_STATUS_META[task.status]} />
                <Badge meta={PRIORITY_META[task.priority]} />
                {task.isMilestone && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
                    <Milestone className="h-3 w-3" strokeWidth={2.5} /> Milestone
                  </span>
                )}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-600">
                    <ShieldAlert className="h-3 w-3" strokeWidth={2.5} /> Overdue
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-ink-muted">{task.project?.name}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink">{task.title}</h1>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* Progress ring — mirrors the one on the project's own detail page */}
              <div className="hidden items-center gap-3 sm:flex" title={`${progressPct}% complete`}>
                <svg width="56" height="56" viewBox="0 0 72 72" className="shrink-0 -rotate-90">
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
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleDeleteTask} loading={deleting}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              )}
            </div>
          </div>

          {task.description && (
            <p className="whitespace-pre-line rounded-lg border border-line/70 bg-surface/70 p-4 text-sm leading-relaxed text-ink-soft">
              {task.description}
            </p>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip
              icon={UserCircle2}
              label="Assignee"
              value={task.assignee?.name ?? 'Unassigned'}
            />
            <StatChip
              icon={Flag}
              label="Priority"
              value={PRIORITY_META[task.priority]?.label}
              tone={clsx('bg-ink-muted/10', PRIORITY_FLAG[task.priority])}
            />
            <StatChip
              icon={CalendarDays}
              label="Due date"
              value={dueLabel === '—' ? formatDate(task.dueDate) : dueLabel}
              tone={isOverdue ? 'bg-danger-50 text-danger-600' : isDueSoon ? 'bg-accent-50 text-accent-600' : 'bg-ink-muted/10 text-ink-soft'}
            />
            <StatChip
              icon={CalendarDays}
              label="Progress"
              value={`${progressPct}%`}
              tone="bg-accent-100 text-accent-600"
            />
          </div>

          {/* Dependencies */}
          {((task.dependsOn && task.dependsOn.length > 0) || (task.blocks && task.blocks.length > 0)) && (
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              {task.dependsOn?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                    <Link2 className="h-3.5 w-3.5" /> Blocked by
                  </span>
                  {task.dependsOn.map((dep) => (
                    <DependencyChip key={dep.id} task={dep} basePath={tasksBasePath} />
                  ))}
                </div>
              )}
              {task.blocks?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                    <Link2 className="h-3.5 w-3.5 rotate-180" /> Blocking
                  </span>
                  {task.blocks.map((dep) => (
                    <DependencyChip key={dep.id} task={dep} basePath={tasksBasePath} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Route status tracker */}
          <div className="border-t border-line pt-5">
            <StatusTracker status={task.status} />
          </div>

          {/* Status moves belong to the assignee or the owning PM. Once a
              task is submitted, its review lives in the Submission panel
              below — not here. */}
          {(canToggleWorkStatus || canSubmitForReview) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              {canToggleWorkStatus &&
                ['TODO', 'IN_PROGRESS'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={task.status === s ? 'primary' : 'secondary'}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className={clsx(
                      'transition-all duration-200',
                      task.status === s ? 'shadow-lg shadow-route-500/25' : 'hover:-translate-y-0.5 hover:shadow-card'
                    )}
                  >
                    {TASK_STATUS_META[s].label}
                  </Button>
                ))}
              {canSubmitForReview && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSubmitModalOpen(true)}
                  className="!border-accent-200 !bg-accent-50 !text-accent-700 hover:!bg-accent-100"
                >
                  <Send className="h-3.5 w-3.5" /> Submit for review
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Dedicated submission record — separate from the free-form
          discussion below. Visible to the assignee, the owning PM, and
          Admins (Admins get full read visibility; review stays the owning
          PM's call, matching how project approval stays the Admin's call). */}
      {submissionEntries.length > 0 && (
        <SubmissionPanel
          entries={submissionEntries}
          itemLabel="task"
          canUndo={isOwningPM || isAdmin}
          onUndo={handleUndoReview}
          canWithdraw={isAssignee}
          onWithdraw={handleWithdrawSubmission}
          reviewSlot={
            awaitingReview && isOwningPM ? (
              <ReviewPanel
                title="This task was submitted for your review"
                subtitle="Approve to mark it complete, or send it back with a comment explaining what needs to change."
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
              />
            ) : null
          }
          viewerNote={
            awaitingReview && !isOwningPM ? (
              <p className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-sm text-sky-700">
                <Eye className="h-4 w-4 shrink-0" />
                {isAdmin
                  ? "Awaiting review from the project manager — you're viewing this as Administrator."
                  : 'Awaiting review from the project manager.'}
              </p>
            ) : null
          }
        />
      )}

      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <MessageSquare className="h-4 w-4 text-ink-muted" /> Discussion
          </h3>
          {commentParticipants.length > 0 && <AvatarStack people={commentParticipants} max={4} />}
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {commentEntries.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Start the conversation about this task below."
            />
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

      {canManage && (
        <TaskForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setTask(updated)}
          task={task}
        />
      )}

      <SubmissionModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit for review"
        subtitle="Add anything the Project Manager should see — notes, files, or links to your work."
        submitLabel="Submit for review"
        onSubmit={handleSubmitForReview}
        context={[
          { label: 'Task', value: task.title },
          { label: 'Due', value: dueLabel === '—' ? formatDate(task.dueDate) : dueLabel, tone: isOverdue ? 'warning' : 'default' },
          { label: 'Priority', value: PRIORITY_META[task.priority]?.label },
        ]}
      />
    </div>
  );
}
