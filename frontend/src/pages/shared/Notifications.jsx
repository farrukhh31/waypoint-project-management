import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, SlidersHorizontal, Inbox, MailCheck } from 'lucide-react';
import clsx from 'clsx';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME } from '../../config/roles';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import FullScreenLoader from '../../components/ui/FullScreenLoader.jsx';
import NotificationPreferencesModal from '../../components/notifications/NotificationPreferencesModal.jsx';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_META, DEFAULT_NOTIFICATION_META } from '../../config/notificationTypes';
import { formatDate } from '../../utils/formatDate';

// Buckets a notification's createdAt into a friendly group label so the
// list reads like an activity feed rather than a flat timestamped table.
function bucketFor(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'This week';
  return 'Earlier';
}

const BUCKET_ORDER = ['Today', 'Yesterday', 'This week', 'Earlier'];

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread'
  const [typeFilter, setTypeFilter] = useState('all');
  const [prefsOpen, setPrefsOpen] = useState(false);

  function handleItemClick(n) {
    if (!n.isRead) markRead(n.id);
    if (n.link) navigate(`${ROLE_HOME[user.role]}${n.link}`);
  }

  const todayCount = useMemo(
    () => notifications.filter((n) => bucketFor(n.createdAt) === 'Today').length,
    [notifications]
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (statusFilter === 'unread' && n.isRead) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, statusFilter, typeFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((n) => {
      const bucket = bucketFor(n.createdAt);
      groups[bucket] = groups[bucket] || [];
      groups[bucket].push(n);
    });
    return BUCKET_ORDER.filter((b) => groups[b]?.length).map((b) => ({ bucket: b, items: groups[b] }));
  }, [filtered]);

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Task assignments, status changes, and discussion activity."
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPrefsOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Preferences
            </Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="secondary" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4" /> Mark all as read
              </Button>
            )}
          </div>
        }
      />

      {/* Quick stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatChip icon={Inbox} label="Total" value={notifications.length} tone="route" />
        <StatChip icon={MailCheck} label="Unread" value={unreadCount} tone="accent" />
        <StatChip icon={CheckCheck} label="Today" value={todayCount} tone="teal" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full border border-line bg-surface p-1 shadow-card">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f.id ? 'bg-route-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              typeFilter === 'all'
                ? 'border-route-500 bg-route-50 text-route-700'
                : 'border-line bg-surface text-ink-muted hover:bg-paper'
            )}
          >
            All types
          </button>
          {NOTIFICATION_TYPES.map((type) => {
            const meta = NOTIFICATION_TYPE_META[type];
            const Icon = meta.icon;
            const active = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(active ? 'all' : type)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active ? 'border-route-500 bg-route-50 text-route-700' : 'border-line bg-surface text-ink-muted hover:bg-paper'
                )}
              >
                <Icon className="h-3 w-3" /> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        {grouped.length === 0 ? (
          <EmptyState
            title={statusFilter === 'unread' ? "You're all caught up" : 'No notifications here'}
            description={
              statusFilter === 'unread'
                ? 'New notifications will appear here.'
                : 'Try a different filter, or check back later.'
            }
          />
        ) : (
          <div className="divide-y divide-line">
            {grouped.map(({ bucket, items }) => (
              <div key={bucket}>
                <p className="bg-paper/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {bucket}
                </p>
                <ul className="divide-y divide-line">
                  {items.map((n) => {
                    const meta = NOTIFICATION_TYPE_META[n.type] || DEFAULT_NOTIFICATION_META;
                    const Icon = meta.icon;
                    return (
                      <li
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleItemClick(n)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleItemClick(n);
                          }
                        }}
                        className={clsx(
                          'group flex cursor-pointer items-start gap-3 px-5 py-3.5 transition-colors hover:bg-paper',
                          !n.isRead && meta.wash
                        )}
                      >
                        <span className={clsx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.chip)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className={clsx('text-sm', n.isRead ? 'text-ink-soft' : 'font-medium text-ink')}>
                              {n.message}
                            </p>
                            {!n.isRead && <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                            <span>{formatDate(n.createdAt)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{meta.label}</span>
                          </div>
                        </div>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n.id);
                            }}
                            className="shrink-0 self-center text-xs font-medium text-route-600 opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                          >
                            Mark as read
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <NotificationPreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}

function StatChip({ icon: Icon, label, value, tone }) {
  const TONES = {
    route: 'bg-route-50 text-route-600',
    accent: 'bg-accent-50 text-accent-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
      <span className={clsx('flex h-9 w-9 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1 text-xs text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
