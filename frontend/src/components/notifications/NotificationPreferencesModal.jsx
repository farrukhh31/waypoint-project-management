import { useEffect, useState } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Switch from '../ui/Switch.jsx';
import Button from '../ui/Button.jsx';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_META } from '../../config/notificationTypes';

export default function NotificationPreferencesModal({ open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [mutedTypes, setMutedTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setLoading(true);
    api
      .get('/users/me/notification-preferences')
      .then(({ data }) => {
        setEmailNotifications(data.data.emailNotifications);
        setMutedTypes(data.data.mutedNotificationTypes || []);
      })
      .finally(() => setLoading(false));
  }, [open]);

  function toggleType(type) {
    setMutedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await api.patch('/users/me/notification-preferences', {
        emailNotifications,
        mutedNotificationTypes: mutedTypes,
      });
      setMessage({ type: 'success', text: 'Preferences saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not save preferences.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Notification preferences" className="max-w-md">
      {loading ? (
        <div className="flex flex-col gap-3 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-paper" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-route-600" />
              <div>
                <p className="text-sm font-medium text-ink">Email me a copy</p>
                <p className="text-xs text-ink-muted">Sent to your account email whenever you get a notification.</p>
              </div>
            </div>
            <Switch checked={emailNotifications} onChange={setEmailNotifications} label="Email notifications" />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Notify me about</p>
            <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {NOTIFICATION_TYPES.map((type) => {
                const meta = NOTIFICATION_TYPE_META[type];
                const Icon = meta.icon;
                const enabled = !mutedTypes.includes(type);
                return (
                  <div key={type} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={'flex h-7 w-7 items-center justify-center rounded-lg ' + meta.chip}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm text-ink">{meta.label}</span>
                    </div>
                    <Switch checked={enabled} onChange={() => toggleType(type)} label={meta.label} />
                  </div>
                );
              })}
            </div>
          </div>

          {message && (
            <div
              className={
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm ' +
                (message.type === 'error' ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600')
              }
            >
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save preferences
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
