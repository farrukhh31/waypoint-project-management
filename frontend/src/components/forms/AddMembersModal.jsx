import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

export default function AddMembersModal({ open, onClose, onSaved, projectId, existingMemberIds = [] }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError('');
    api.get('/users/assignable', { params: { role: 'TEAM_MEMBER' } }).then(({ data }) => {
      setUsers(data.data.users.filter((u) => !existingMemberIds.includes(u.id)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected.length) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { memberIds: selected });
      onSaved(data.data.project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add members.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add team members">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto rounded border border-line p-2">
          {users.length === 0 && (
            <p className="px-1 py-1 text-xs text-ink-muted">Everyone available is already on this project.</p>
          )}
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              {u.name}
              <span className="text-xs text-ink-muted">({u.email})</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!selected.length}>
            Add {selected.length || ''}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
