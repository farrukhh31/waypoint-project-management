import { useState } from 'react';
import { Send, CheckCircle2, RotateCcw, ClipboardCheck, Eye, Undo2 } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import DiscussionAttachments from './DiscussionAttachments.jsx';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';

// Per-kind visual language shared between the hero status pill and each
// timeline entry, so "awaiting review" reads the same sky blue everywhere,
// "approved" the same green, etc.
const KIND_META = {
  SUBMITTED: {
    icon: Send,
    label: 'Submitted',
    dot: 'bg-sky-500',
    ring: 'ring-sky-100',
    chip: 'bg-sky-50 text-sky-700 border-sky-200',
    iconWrap: 'bg-sky-500 text-white',
  },
  APPROVED: {
    icon: CheckCircle2,
    label: 'Approved',
    dot: 'bg-success-500',
    ring: 'ring-success-100',
    chip: 'bg-success-50 text-success-700 border-success-200',
    iconWrap: 'bg-success-500 text-white',
  },
  CHANGES_REQUESTED: {
    icon: RotateCcw,
    label: 'Changes requested',
    dot: 'bg-danger-500',
    ring: 'ring-danger-100',
    chip: 'bg-danger-50 text-danger-700 border-danger-200',
    iconWrap: 'bg-danger-500 text-white',
  },
};

// STATUS_META keyed by the *current* review state (derived from the most
// recent entry) — drives the hero banner at the top of the panel.
const STATUS_META = {
  AWAITING: { label: 'Awaiting review', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  APPROVED: { label: 'Approved', className: 'bg-success-50 text-success-700 border-success-200' },
  CHANGES_REQUESTED: { label: 'Changes requested', className: 'bg-danger-50 text-danger-700 border-danger-200' },
};

/**
 * Dedicated "Submission" section for a task or project — pulled out of the
 * free-form discussion thread so a submitted deliverable (notes + files +
 * links) and its full review history (submit → changes requested →
 * resubmit → approve) read as a proper record, not buried between chat
 * messages.
 *
 * @param {object[]} entries - discussion rows with kind SUBMITTED/APPROVED/CHANGES_REQUESTED (COMMENT rows should be filtered out by the caller)
 * @param {'task'|'project'} itemLabel - drives wording ("review" vs "approval")
 * @param {React.ReactNode} [reviewSlot] - the ReviewPanel (approve/request changes) for whoever can act right now
 * @param {React.ReactNode} [viewerNote] - a note explaining the viewer's relationship to this submission when they can't act (e.g. "Submitted — awaiting review", or an Admin's read-only notice)
 * @param {boolean} [canUndo] - whether the current viewer may undo the most recent approve/request-changes decision (owning PM or Admin for tasks; Admin for projects)
 * @param {() => Promise<void>} [onUndo] - reverts the decision and puts the item back up for review/approval
 * @param {boolean} [canWithdraw] - whether the current viewer is the submitter and may withdraw their own still-pending submission (before any decision has been made)
 * @param {() => Promise<void>} [onWithdraw] - pulls the pending submission back so the submitter can revise and resubmit
 */
export default function SubmissionPanel({
  entries = [],
  itemLabel = 'task',
  reviewSlot = null,
  viewerNote = null,
  canUndo = false,
  onUndo = null,
  canWithdraw = false,
  onWithdraw = null,
}) {
  const [undoing, setUndoing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  if (entries.length === 0) return null;

  const chronological = [...entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const latest = chronological[chronological.length - 1];
  const timeline = [...chronological].reverse(); // most recent first
  const cycleCount = chronological.filter((e) => e.kind === 'SUBMITTED').length;

  const currentStatus =
    latest.kind === 'APPROVED' ? 'APPROVED' : latest.kind === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'AWAITING';
  const statusMeta = STATUS_META[currentStatus];
  const approvalNoun = itemLabel === 'project' ? 'approval' : 'review';
  const showUndo = canUndo && onUndo && currentStatus !== 'AWAITING';
  const showWithdraw = canWithdraw && onWithdraw && currentStatus === 'AWAITING';

  async function handleUndo() {
    const verb = currentStatus === 'APPROVED' ? 'the approval' : 'the changes-requested decision';
    if (!window.confirm(`Undo ${verb} on this ${itemLabel}? It will go back to awaiting ${approvalNoun}.`)) return;
    setUndoing(true);
    try {
      await onUndo();
    } finally {
      setUndoing(false);
    }
  }

  async function handleWithdraw() {
    if (!window.confirm(`Withdraw this submission? You'll be able to revise it and resubmit when ready.`)) return;
    setWithdrawing(true);
    try {
      await onWithdraw();
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface shadow-card">
      {/* Hero */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-route-50 text-route-600">
            <ClipboardCheck className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">Submission</h3>
            {cycleCount > 1 && (
              <p className="text-xs text-ink-muted">
                Submitted {cycleCount} times — latest below, full history further down.
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', statusMeta.className)}>
            {statusMeta.label}
          </span>
          {showUndo && (
            <Button size="sm" variant="secondary" loading={undoing} onClick={handleUndo} className="!text-xs">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </Button>
          )}
          {showWithdraw && (
            <Button size="sm" variant="secondary" loading={withdrawing} onClick={handleWithdraw} className="!text-xs">
              <Undo2 className="h-3.5 w-3.5" /> Withdraw
            </Button>
          )}
        </div>
      </div>

      {/* Latest submission, front and center */}
      <SubmissionEntry entry={latest} featured itemLabel={itemLabel} />

      {/* Reviewer action or read-only note */}
      {(reviewSlot || viewerNote) && <div className="px-5">{reviewSlot || viewerNote}</div>}

      {/* Full history, if this went through more than one round */}
      {timeline.length > 1 && (
        <details className="group border-t border-line px-5 pb-4 pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink-soft">
            <Eye className="h-3.5 w-3.5" />
            View full {approvalNoun} history ({timeline.length})
          </summary>
          <ol className="relative mt-3 flex flex-col gap-4 border-l border-line pl-5">
            {timeline.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  className={clsx(
                    'absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface',
                    KIND_META[entry.kind]?.dot || 'bg-ink-muted'
                  )}
                />
                <SubmissionEntry entry={entry} itemLabel={itemLabel} />
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function SubmissionEntry({ entry, featured = false, itemLabel }) {
  const meta = KIND_META[entry.kind] || KIND_META.SUBMITTED;
  const Icon = meta.icon;
  const verb =
    entry.kind === 'SUBMITTED'
      ? `submitted this ${itemLabel} for ${itemLabel === 'project' ? 'approval' : 'review'}`
      : entry.kind === 'APPROVED'
      ? 'approved this'
      : 'requested changes';

  return (
    <div className={featured ? 'px-5' : ''}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar name={entry.author?.name} size={featured ? 'md' : 'sm'} />
          <span
            className={clsx(
              'absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full ring-2 ring-surface',
              meta.iconWrap
            )}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-sm font-medium text-ink">{entry.author?.name}</span>
            <span className="text-sm text-ink-muted">{verb}</span>
            <span className="text-xs text-ink-muted" title={formatDate(entry.createdAt)}>
              · {formatRelativeTime(entry.createdAt)}
            </span>
          </div>
          {entry.message && (
            <p
              className={clsx(
                'mt-1.5 whitespace-pre-line rounded-lg border p-3 text-sm leading-relaxed',
                entry.kind === 'CHANGES_REQUESTED'
                  ? 'border-danger-100 bg-danger-50/40 text-ink-soft'
                  : 'border-line/70 bg-paper/60 text-ink-soft'
              )}
            >
              {entry.message}
            </p>
          )}
          <DiscussionAttachments attachments={entry.attachments} links={entry.links} />
        </div>
      </div>
    </div>
  );
}
