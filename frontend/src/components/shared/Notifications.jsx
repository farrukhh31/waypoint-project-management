import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, SlidersHorizontal, Inbox, MailCheck, CalendarCheck2, Bell, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME } from '../../config/roles';
import PageHeader from '../../components/shared/PageHeader.jsx';
import Card, { CardHeader, CardBody } from '../../components/ui/Card.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
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

// Groups the type-filter pills so tasks / projects / team read as clusters
// instead of one flat undifferentiated row — mirrors NOTIFICATION_TYPE_META.group.
const TYPE_GROUP_ORDER = ['Tasks', 'Activity', 'Projects', 'Team'];

export default function Notifications() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const homePath = ROLE_HOME[user?.role] ?? '';
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread'
  const [typeFilter, setTypeFilter] = useState('all');
  const [prefsOpen, setPrefsOpen] = useState(false);

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

  const typesByGroup = useMemo(() => {
    const byGroup = {};
    NOTIFICATION_TYPES.forEach((type) => {
      const meta = NOTIFICATION_TYPE_META[type] || DEFAULT_NOTIFICATION_META;
      byGroup[meta.group] = byGroup[meta.group] || [];
      byGroup[meta.group].push(type);
    });
    return TYPE_GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({ group: g, types: byGroup[g] }));
  }, []);

  // A single running index across every visible row, independent of which
  // bucket it's in, so the entrance stagger reads as one continuous cascade.
  let rowIndex = -1;

  function openNotification(n) {
    if (!n.isRead) markRead(n.id);
    if (n.link) navigate(`${homePath}${n.link}`);
  }

  if (loading) return <FullScreenLoader />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Task assignments, status changes, project activity, and discussion updates."
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

      {/* Quick stats — same StatCard used across every dashboard, so this
          page reads as one continuous product rather than a bolted-on list. */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total notifications" value={notifications.length} icon={Inbox} accent="route" tilt />
        <StatCard label="Unread" value={unreadCount} icon={MailCheck} accent="accent" tilt />
        <StatCard label="Today" value={todayCount} icon={CalendarCheck2} accent="teal" tilt />
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
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150',
                statusFilter === f.id ? 'bg-route-500 text-white shadow-sm' : 'text-ink-soft hover:bg-paper'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 hover:-translate-y-px',
              typeFilter === 'all'
                ? 'border-route-500 bg-route-50 text-route-700 shadow-sm'
                : 'border-line bg-surface text-ink-muted hover:bg-paper'
            )}
          >
            All types
          </button>
          {typesByGroup.map(({ group, types }, gi) => (
            <span key={group} className={clsx('flex items-center gap-1.5', gi > 0 && 'ml-1 border-l border-line pl-2.5')}>
              {types.map((type) => {
                const meta = NOTIFICATION_TYPE_META[type];
                const Icon = meta.icon;
                const active = typeFilter === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(active ? 'all' : type)}
                    title={meta.group}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 hover:-translate-y-px',
                      active ? 'border-route-500 bg-route-50 text-route-700 shadow-sm' : 'border-line bg-surface text-ink-muted hover:bg-paper'
                    )}
                  >
                    <Icon className="h-3 w-3" /> {meta.label}
                  </button>
                );
              })}
            </span>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-pop">
        <CardHeader className="bg-gradient-to-r from-route-50/60 via-surface to-surface">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-route-500 text-white shadow-sm">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">All notifications</h3>
              <span className="text-xs text-ink-muted">
                {filtered.length} of {notifications.length} shown
              </span>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-600">
              {unreadCount} unread
            </span>
          )}
        </CardHeader>

        <CardBody className="p-0">
          {grouped.length === 0 ? (
            <div className="px-5">
              <EmptyState
                title={statusFilter === 'unread' ? "You're all caught up" : 'No notifications here'}
                description={
                  statusFilter === 'unread'
                    ? 'New notifications will appear here.'
                    : 'Try a different filter, or check back later.'
                }
              />
            </div>
          ) : (
            <div
              className={clsx(
                'max-h-[640px] overflow-y-auto',
                '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-line'
              )}
            >
              {grouped.map(({ bucket, items }) => (
                <div key={bucket}>
                  <p className="sticky top-0 z-10 border-b border-line bg-paper/90 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted backdrop-blur">
                    {bucket}
                  </p>
                  <ul className="relative divide-y divide-line">
                    {items.length > 1 && (
                      <div className="route-line-v absolute bottom-6 left-[33px] top-6 w-px" aria-hidden="true" />
                    )}
                    {items.map((n) => {
                      const meta = NOTIFICATION_TYPE_META[n.type] || DEFAULT_NOTIFICATION_META;
                      const Icon = meta.icon;
                      rowIndex += 1;
                      return (
                        <li
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openNotification(n)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openNotification(n)}
                          style={{ animation: `fade-in-up 0.3s ease-out ${Math.min(rowIndex * 25, 300)}ms both` }}
                          className={clsx(
                            'group relative flex cursor-pointer items-start gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-paper',
                            !n.isRead && meta.wash
                          )}
                        >
                          <span
                            className={clsx(
                              'relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 ring-offset-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-card',
                              meta.ring
                            )}
                          >
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
                          <div className="flex shrink-0 items-center gap-2 self-center">
                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(n.id);
                                }}
                                className="text-xs font-medium text-route-600 opacity-100 transition-opacity hover:underline sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                              >
                                Mark as read
                              </button>
                            )}
                            {n.link && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-muted opacity-0 shadow-card transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-route-600 group-hover:opacity-100">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <NotificationPreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}