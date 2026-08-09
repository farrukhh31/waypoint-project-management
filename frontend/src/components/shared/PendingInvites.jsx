import { useState } from 'react';
import { Clock, RotateCw, X } from 'lucide-react';
import api from '../../lib/api';
import { useList } from '../../hooks/useList';
import { ROLE_LABELS } from '../../config/roles';
import Card, { CardHeader } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';

const STATUS_META = {
  PENDING: 'bg-accent-100 text-accent-600',
  EXPIRED: 'bg-ink-muted/10 text-ink-soft',
  ACCEPTED: 'bg-success-50 text-success-600',
  REVOKED: 'bg-danger-50 text-danger-600',
};

function timeUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'expired';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export default function PendingInvites({ refreshKey }) {
  const [busyId, setBusyId] = useState(null);
  const [lastLink, setLastLink] = useState(null);

  const { items, loading, refetch } = useList(
    '/invites',
    'invites',
    { status: 'PENDING', limit: 20 },
    [refreshKey]
  );

  async function handleResend(invite) {
    setBusyId(invite.id);
    setLastLink(null);
    try {
      const { data } = await api.post(`/invites/${invite.id}/resend`);
      setLastLink({ id: invite.id, link: data.data.inviteLink });
      refetch();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not resend this invite.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(invite) {
    if (!window.confirm(`Revoke the invite sent to ${invite.email}?`)) return;
    setBusyId(invite.id);
    try {
      await api.delete(`/invites/${invite.id}`);
      refetch();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not revoke this invite.');
    } finally {
      setBusyId(null);
    }
  }

  if (!loading && items.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">Pending invites</h3>
          <p className="mt-0.5 text-xs text-ink-muted">Sent, not yet accepted.</p>
        </div>
      </CardHeader>

      {loading ? (
        <div className="flex flex-col gap-px p-1">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-line/40" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((inv) => (
            <li key={inv.id} className="flex flex-col gap-2 px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{inv.email}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                    {ROLE_LABELS[inv.role]} · invited by {inv.invitedBy?.name || 'an admin'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_META[inv.effectiveStatus] || STATUS_META.PENDING
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {inv.effectiveStatus === 'EXPIRED' ? 'Expired' : `Expires ${timeUntil(inv.expiresAt)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResend(inv)}
                    disabled={busyId === inv.id}
                    className="rounded p-1.5 text-ink-muted hover:bg-paper hover:text-ink disabled:opacity-50"
                    aria-label={`Resend invite to ${inv.email}`}
                    title="Resend"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(inv)}
                    disabled={busyId === inv.id}
                    className="rounded p-1.5 text-ink-muted hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                    aria-label={`Revoke invite to ${inv.email}`}
                    title="Revoke"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {lastLink?.id === inv.id && (
                <code className="truncate rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink-soft">
                  {lastLink.link}
                </code>
              )}
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && !loading && <EmptyState title="No pending invites" />}
    </Card>
  );
}
