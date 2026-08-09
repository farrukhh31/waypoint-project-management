import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Input, { Field, Textarea, Select } from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import BlockedCompletionModal from './BlockedCompletionModal.jsx';
import { PRIORITIES, PRIORITY_META, PROJECT_STATUSES, PROJECT_STATUS_META } from '../../config/statuses';

// COMPLETED and PENDING_APPROVAL are reachable only through the
// submit/review flow (see ProjectDetails), not through this generic form —
// the backend rejects them here on purpose.
const EDITABLE_STATUSES = PROJECT_STATUSES.filter((s) => s !== 'COMPLETED' && s !== 'PENDING_APPROVAL');

const emptyForm = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  priority: 'MEDIUM',
  status: 'PLANNED',
  managerId: '',
  memberIds: [],
};

// `project` present -> edit mode. `canReassignManager` gates the manager
// field: only Admins may change it (a PM editing their own project must not
// send managerId at all, or the backend 403s the whole request).
export default function ProjectForm({ open, onClose, onSaved, project = null, canReassignManager = true }) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState(emptyForm);
  const [managers, setManagers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(null); // { tasks } from a PROJECT_HAS_INCOMPLETE_TASKS error

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      project
        ? {
            name: project.name,
            description: project.description || '',
            startDate: project.startDate?.slice(0, 10) || '',
            endDate: project.endDate?.slice(0, 10) || '',
            priority: project.priority,
            status: project.status,
            managerId: project.managerId,
            memberIds: [],
          }
        : emptyForm
    );
    if (!isEdit || canReassignManager) {
      api
        .get('/users/assignable', { params: { role: 'PROJECT_MANAGER' } })
        .then(({ data }) => setManagers(data.data.users));
    }
    if (!isEdit) {
      api
        .get('/users/assignable', { params: { role: 'TEAM_MEMBER' } })
        .then(({ data }) => setTeamMembers(data.data.users));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);

  function toggleMember(id) {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((m) => m !== id) : [...f.memberIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const payload = {
          name: form.name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          priority: form.priority,
          status: form.status,
        };
        if (canReassignManager) payload.managerId = form.managerId;
        const { data } = await api.patch(`/projects/${project.id}`, payload);
        onSaved(data.data.project);
      } else {
        const { data } = await api.post('/projects', form);
        onSaved(data.data.project);
      }
      onClose();
    } catch (err) {
      if (err.response?.data?.details?.code === 'PROJECT_HAS_INCOMPLETE_TASKS') {
        setBlocked({ tasks: err.response.data.details.incompleteTasks });
      } else {
        setError(err.response?.data?.message || 'Could not save the project.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit project' : 'New project'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name" htmlFor="p-name">
          <Input
            id="p-name"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Description" htmlFor="p-desc">
          <Textarea
            id="p-desc"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="p-start">
            <Input
              id="p-start"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="End date" htmlFor="p-end">
            <Input
              id="p-end"
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" htmlFor="p-priority">
            <Select
              id="p-priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="p-status">
            <Select
              id="p-status"
              value={form.status}
              disabled={project?.status === 'COMPLETED' || project?.status === 'PENDING_APPROVAL'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {(EDITABLE_STATUSES.includes(form.status) ? EDITABLE_STATUSES : [form.status, ...EDITABLE_STATUSES]).map(
                (s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_META[s].label}
                  </option>
                )
              )}
            </Select>
            {(project?.status === 'COMPLETED' || project?.status === 'PENDING_APPROVAL') && (
              <p className="mt-1 text-xs text-ink-muted">
                {project.status === 'COMPLETED'
                  ? 'Completed projects keep their status.'
                  : 'This project is awaiting approval — status changes here are disabled until it\'s reviewed.'}
              </p>
            )}
          </Field>
        </div>

        <Field label="Project manager" htmlFor="p-manager">
          {canReassignManager ? (
            <Select
              id="p-manager"
              required
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            >
              <option value="">Select a manager…</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          ) : (
            <p className="rounded border border-line bg-paper px-3 py-2 text-sm text-ink-muted">
              {project?.manager?.name} — only an Administrator can reassign the manager.
            </p>
          )}
        </Field>

        {!isEdit && (
          <Field label="Initial team members" htmlFor="p-members">
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded border border-line p-2">
              {teamMembers.length === 0 && (
                <p className="px-1 py-1 text-xs text-ink-muted">No team members available yet.</p>
              )}
              {teamMembers.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                  />
                  {m.name}
                  <span className="text-xs text-ink-muted">({m.email})</span>
                </label>
              ))}
            </div>
          </Field>
        )}

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>

    <BlockedCompletionModal
      open={Boolean(blocked)}
      onClose={() => setBlocked(null)}
      projectName={form.name}
      tasks={blocked?.tasks}
    />
    </>
  );
}
