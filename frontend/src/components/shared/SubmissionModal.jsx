import { useState } from 'react';
import { Sparkles, Paperclip, Link2, Send, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Textarea } from '../ui/Input.jsx';
import AttachmentsLinksPicker from './AttachmentsLinksPicker.jsx';

// Used for both "Submit for review" (task) and "Submit for approval"
// (project) — the deliverable is the same shape either way: a note plus
// whatever files/links prove the work is done.
//
// Fixed-height card: the intro banner, context strip, and footer never
// move, and only the notes+attachments middle section scrolls (with a
// scrollbar that stays hidden until hovered — see .scroll-hover in
// index.css) — so submitting one file feels the same size as submitting
// ten, instead of the modal growing to fit whatever's inside it.
//
// @param {{ label: string, value: string, tone?: 'default'|'warning' }[]} [context] -
//   quick facts about what's being submitted (due date, priority, progress…)
//   shown as a chip strip under the intro banner.
export default function SubmissionModal({ open, onClose, title, subtitle, context = [], submitLabel = 'Submit', onSubmit }) {
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setComment('');
    setAttachments([]);
    setLinks([]);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ comment: comment.trim() || undefined, attachments, links });
      reset();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const attachmentCount = attachments.length + links.length;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={title}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex h-[75vh] max-h-[620px] min-h-[420px] flex-col">
        {/* Fixed header block — intro banner + context strip, never scrolls */}
        <div className="flex shrink-0 flex-col gap-3 pb-4">
          <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 via-surface to-surface p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white shadow-lg shadow-sky-500/25">
              <Send className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Ready to hand this off?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                {subtitle || 'Add anything the reviewer should see — notes, files, or links to your work.'}
              </p>
            </div>
          </div>

          {context.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {context.map((c) => (
                <span
                  key={c.label}
                  className={clsx(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium',
                    c.tone === 'warning'
                      ? 'border-danger-200 bg-danger-50 text-danger-700'
                      : 'border-line bg-paper text-ink-soft'
                  )}
                >
                  <span className="text-ink-muted">{c.label}</span>
                  <span className="font-semibold">{c.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable middle — notes + attachments; grows/shrinks, never the card itself */}
        <div className="scroll-hover flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="submission-comment" className="text-sm font-medium text-ink-soft">
                Notes for the reviewer
              </label>
              <span className="text-[11px] text-ink-muted">Optional</span>
            </div>
            <Textarea
              id="submission-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you do, what should they focus on, anything still in progress…"
              className="resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              <Paperclip className="h-3.5 w-3.5 text-ink-muted" /> Files &amp; links
            </label>
            <AttachmentsLinksPicker
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              links={links}
              onLinksChange={setLinks}
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* Fixed footer — summary + actions, never scrolls */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line pt-4">
          <span
            className={clsx(
              'flex items-center gap-1.5 text-xs',
              attachmentCount > 0 ? 'font-medium text-route-600' : 'text-ink-muted'
            )}
          >
            {attachmentCount > 0 ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {attachments.length > 0 && `${attachments.length} file${attachments.length === 1 ? '' : 's'}`}
                {attachments.length > 0 && links.length > 0 && ' · '}
                {links.length > 0 && `${links.length} link${links.length === 1 ? '' : 's'}`} attached
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" /> No files or links attached yet
              </>
            )}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={submitting} onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="!bg-gradient-to-r !from-sky-500 !to-route-600 shadow-lg shadow-sky-500/25 hover:!from-sky-600 hover:!to-route-700"
            >
              <Send className="h-3.5 w-3.5" /> {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
