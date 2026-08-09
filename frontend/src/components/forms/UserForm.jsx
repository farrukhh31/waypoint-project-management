import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Input, { Field, Select } from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { ROLES, ROLE_LABELS } from '../../config/roles';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: ROLES.TEAM_MEMBER,
  jobTitle: '',
  isActive: true,
  canInviteMembers: false,
};

export default function UserForm({ open, onClose, onSaved, user = null }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      user
        ? {
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            jobTitle: user.jobTitle || '',
            isActive: user.isActive,
            canInviteMembers: user.canInviteMembers || false,
          }
        : emptyForm
    );
  }, [open, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const { name, email, role, jobTitle, isActive, canInviteMembers } = form;
        const { data } = await api.patch(`/users/${user.id}`, {
          name,
          email,
          role,
          jobTitle,
          isActive,
          canInviteMembers,
        });
        onSaved(data.data.user);
      } else {
        const { data } = await api.post('/users', form);
        onSaved(data.data.user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit user' : 'New user'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full name" htmlFor="u-name">
          <Input
            id="u-name"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Email" htmlFor="u-email">
          <Input
            id="u-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>

        {!isEdit && (
          <Field label="Temporary password" htmlFor="u-password">
            <Input
              id="u-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="text-xs text-ink-muted">
              At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
            </p>
          </Field>
        )}

        <Field label="Job title" htmlFor="u-title">
          <Input
            id="u-title"
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />
        </Field>

        <Field label="Role" htmlFor="u-role">
          <Select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active account
          </label>
        )}

        {isEdit && form.role === ROLES.PROJECT_MANAGER && (
          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.canInviteMembers}
              onChange={(e) => setForm({ ...form, canInviteMembers: e.target.checked })}
            />
            <span>
              Can invite team members
              <span className="block text-xs text-ink-muted">
                Lets this Project Manager send invites, but only into projects they manage — never as
                Admin or Project Manager.
              </span>
            </span>
          </label>
        )}

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}