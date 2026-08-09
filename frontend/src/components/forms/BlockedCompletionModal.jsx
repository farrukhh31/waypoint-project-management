import { ShieldAlert, MapPin } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { TASK_STATUS_META } from '../../config/statuses';

// Theme-matched stop-sign for the "can't complete/submit this project yet"
// rule. Applies the same block to Admin and PM alike — the backend enforces
// it for real; this just explains *why* in the same visual language as the
// rest of the app (route-line motif, status badges) instead of a bare
// alert() or a one-line form error.
export default function BlockedCompletionModal({ open, onClose, projectName, tasks = [], actionLabel = 'Completed' }) {
  return (
    <Modal open={open} onClose={onClose} title="Not on the map yet" className="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-danger-50 bg-danger-50/60 p-3.5">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" />
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">{projectName}</span> can&rsquo;t be marked{' '}
            <span className="font-medium text-ink">{actionLabel}</span> yet — {tasks.length} task
            {tasks.length === 1 ? '' : 's'} still {tasks.length === 1 ? 'has' : 'have'} to reach the end of the
            road first. This applies whether you&rsquo;re an Administrator or a Project Manager.
          </p>
        </div>

        <div className="relative ml-3 flex flex-col gap-3 pl-5">
          {tasks.length > 1 && (
            <div className="route-line-v absolute bottom-2 left-[5px] top-2 w-px" aria-hidden="true" />
          )}
          {tasks.map((task) => (
            <div key={task.id} className="relative">
              <MapPin className="absolute -left-5 top-0.5 h-3.5 w-3.5 text-ink-muted" />
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2 shadow-card">
                <span className="min-w-0 truncate text-sm text-ink-soft">{task.title}</span>
                <Badge meta={TASK_STATUS_META[task.status]} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <Button type="button" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
}
