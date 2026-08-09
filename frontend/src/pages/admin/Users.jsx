import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, MailPlus, Users as UsersIcon, ShieldCheck, Briefcase, Users2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useList } from '../../hooks/useList';
import { ROLES, ROLE_LABELS } from '../../config/roles';
import PageHeader from '../../components/shared/PageHeader.jsx';
import { Toolbar, SearchField, Select } from '../../components/shared/Toolbar.jsx';
import PendingInvites from '../../components/shared/PendingInvites.jsx';
import UserCard from '../../components/shared/UserCard.jsx';
import UserProfileModal from '../../components/shared/UserProfileModal.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import UserForm from '../../components/forms/UserForm.jsx';
import InviteForm from '../../components/forms/InviteForm.jsx';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitesRefreshKey, setInvitesRefreshKey] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [viewUserId, setViewUserId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [roleCounts, setRoleCounts] = useState(null);

  // Lets the Topbar's "Create" shortcut (?invite=1) open this form directly.
  useEffect(() => {
    if (searchParams.get('invite') === '1') {
      setInviteOpen(true);
      setSearchParams((params) => {
        params.delete('invite');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { items, pagination, loading, refetch } = useList(
    '/users',
    'users',
    { search, role, page },
    [search, role, page]
  );

  // Lightweight org-wide breakdown for the stat row above the grid — three
  // count-only requests (limit: 1, we only read pagination.total), so the
  // cards stay accurate across every page/filter without a dedicated
  // aggregate endpoint.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      Object.values(ROLES).map((r) => api.get('/users', { params: { role: r, limit: 1 } }))
    )
      .then((responses) => {
        if (cancelled) return;
        const counts = {};
        Object.values(ROLES).forEach((r, i) => {
          counts[r] = responses[i].data.data.pagination?.total ?? 0;
        });
        setRoleCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setRoleCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [items.length, invitesRefreshKey]);

  const totalUsers = roleCounts
    ? Object.values(roleCounts).reduce((sum, n) => sum + n, 0)
    : pagination?.total;

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function openCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(u) {
    setEditingUser(u);
    setFormOpen(true);
  }

  function openView(u) {
    setViewUserId(u.id);
  }

  function requestDelete(u) {
    setPendingDelete(u);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await api.delete(`/users/${pendingDelete.id}`);
      setPendingDelete(null);
      refetch();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not delete this user.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Every account in the organization, and the role each one holds. New teammates join by invite."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add directly
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <MailPlus className="h-4 w-4" /> Invite user
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} icon={UsersIcon} accent="route" tilt />
        <StatCard
          label={ROLE_LABELS[ROLES.ADMIN] + 's'}
          value={roleCounts?.[ROLES.ADMIN]}
          icon={ShieldCheck}
          accent="danger"
          tilt
        />
        <StatCard
          label={ROLE_LABELS[ROLES.PROJECT_MANAGER] + 's'}
          value={roleCounts?.[ROLES.PROJECT_MANAGER]}
          icon={Briefcase}
          accent="sky"
          tilt
        />
        <StatCard
          label={ROLE_LABELS[ROLES.TEAM_MEMBER] + 's'}
          value={roleCounts?.[ROLES.TEAM_MEMBER]}
          icon={Users2}
          accent="teal"
          tilt
        />
      </div>

      <Toolbar>
        <SearchField value={search} onChange={updateFilter(setSearch)} placeholder="Search users…" />
        <Select
          value={role}
          onChange={updateFilter(setRole)}
          placeholder="All roles"
          options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Toolbar>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[196px] animate-pulse rounded-lg bg-line/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try a different search or filter, or invite someone new to the workspace."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((u, i) => (
            <UserCard
              key={u.id}
              user={u}
              canManage
              isSelf={u.id === currentUser.id}
              onView={openView}
              onEdit={openEdit}
              onDelete={requestDelete}
              deleting={deletingId === u.id}
              style={{ transitionDelay: `${Math.min(i * 60, 420)}ms` }}
            />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <PendingInvites refreshKey={invitesRefreshKey} />

      <UserForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => refetch()}
        user={editingUser}
      />

      <InviteForm
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSent={() => setInvitesRefreshKey((k) => k + 1)}
      />

      <UserProfileModal userId={viewUserId} open={Boolean(viewUserId)} onClose={() => setViewUserId(null)} />

      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={Boolean(deletingId)}
        title="Delete this account?"
        message={
          pendingDelete && (
            <>
              Delete <span className="font-medium text-ink">{pendingDelete.name}</span>&rsquo;s account? This cannot
              be undone — they will immediately lose access and any records tied only to them will be removed.
            </>
          )
        }
        confirmLabel="Delete account"
      />
    </div>
  );
}