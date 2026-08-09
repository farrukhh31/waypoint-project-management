import { useState } from 'react';
import { CheckCircle2, RotateCcw, Send } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Textarea, Field } from '../ui/Input.jsx';
import AttachmentsLinksPicker from './AttachmentsLinksPicker.jsx';

// Shared "reviewer" panel: approve (optional comment) or request changes
// (comment required, since the person redoing the work needs to know why).
// Either decision can carry its own files/links (e.g. redlines, an
// annotated screenshot). Used by the owning Project Manager on a submitted
// task, and by an Administrator on a submitted project.
export default function ReviewPanel({ title, subtitle, onApprove, onRequestChanges }) {
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState([]);
  const [mode, setMode] = useState(null); // null | 'changes'
  const [busy, setBusy] = useState(false);

  function reset() {
    setComment('');
    setAttachments([]);
    setLinks([]);
  }

  async function handleApprove() {
    setBusy(true);
    try {
      await onApprove({ comment: comment.trim() || undefined, attachments, links });
      reset();
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestChanges() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await onRequestChanges({ comment: comment.trim(), attachments, links });
      reset();
      setMode(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50/60 p-4">
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>

      {mode === 'changes' ? (
        <div className="flex flex-col gap-3">
          <Textarea
            autoFocus
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain what needs to change before this can be approved…"
          />
          <Field label="Attach files or links (optional)">
            <AttachmentsLinksPicker
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              links={links}
              onLinksChange={setLinks}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setMode(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button size="sm" variant="danger" disabled={!comment.trim()} loading={busy} onClick={handleRequestChanges}>
              <Send className="h-3.5 w-3.5" /> Send back with comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            loading={busy}
            onClick={handleApprove}
            className="!bg-success-500 shadow-lg shadow-success-500/20 hover:!bg-success-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => setMode('changes')}>
            <RotateCcw className="h-3.5 w-3.5" /> Request changes
          </Button>
        </div>
      )}
    </div>
  );
}
