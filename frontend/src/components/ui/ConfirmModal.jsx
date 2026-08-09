import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

// A themed stand-in for window.confirm() — used anywhere a destructive
// action (delete an account, remove a member) needs the admin to explicitly
// confirm before it happens. Danger-toned to match the rest of the app's
// destructive-action language (danger-50/600, ShieldAlert-style icon chip).
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-danger-50 bg-danger-50/60 p-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" />
          <p className="text-sm text-ink-soft">{message}</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}