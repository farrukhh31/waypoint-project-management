import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useNotifications } from '../../hooks/useNotifications';
import { NOTIFICATION_TYPE_META, DEFAULT_NOTIFICATION_META } from '../../config/notificationTypes';
import { formatDate } from '../../utils/formatDate';

export default function NotificationBell({ homePath }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const preview = notifications.slice(0, 6);

  function handleItemClick(n) {
    if (!n.isRead) markRead(n.id);
    setOpen(false);
    // Notification links are stored portal-agnostic (e.g. "/tasks/123") so
    // the same notification reads correctly for whichever role receives
    // it — prefix with this viewer's own portal before navigating.
    navigate(n.link ? `${homePath}${n.link}` : `${homePath}/notifications`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-paper"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded border border-line bg-surface shadow-pop"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <p className="text-sm font-medium text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-route-600 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {preview.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-sm text-ink-muted">You're all caught up.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={clsx(
                      'flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left hover:bg-paper',
                      !n.isRead && 'bg-route-50/40'
                    )}
                  >
                    <span className="text-sm text-ink">{n.message}</span>
                    <span className="text-xs text-ink-muted">{formatDate(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(`${homePath}/notifications`);
            }}
            className="block w-full border-t border-line px-3.5 py-2.5 text-center text-xs font-medium text-route-600 hover:bg-paper"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}
