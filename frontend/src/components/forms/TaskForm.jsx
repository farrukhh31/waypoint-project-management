import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Input, { Field, Textarea, Select } from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { PRIORITIES, PRIORITY_META } from '../../config/statuses';

const emptyForm = { title: '', description: '', projectId: '', assigneeId: '', priority: 'MEDIUM', dueDate: '' };

// `task` present -> edit mode (project can't be changed once created, per the
// backend's updateTaskSchema). `fixedProjectId`/`fixedProjectName` lock the
// project picker when opened from within a project's own page.
export default function TaskForm({
  open,
  onClose,
  onSaved,
  task = null,
  fixedProjectId = null,
  fixedProjectName = null,
}) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(emptyForm);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeProjectId = isEdit ? task?.projectId : form.projectId;

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isEdit) {
      setForm({
        title: task.title,
        description: task.description || '',
        projectId: task.projectId,
        assigneeId: task.assigneeId || '',
        priority: task.priority,
        dueDate: task.dueDate?.slice(0, 10) || '',
      });
    } else {
      setForm({ ...emptyForm, projectId: fixedProjectId || '' });
      if (!fixedProjectId) {
        api.get('/projects', { params: { limit: 100 } }).then(({ data }) => setProjects(data.data.projects));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, fixedProjectId]);

  useEffect(() => {
    if (!open || !activeProjectId) {
      setMembers([]);
      return;
    }
    api.get(`/projects/${activeProjectId}`).then(({ data }) => setMembers(data.data.project.members || []));
  }, [open, activeProjectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        const { data } = await api.patch(`/tasks/${task.id}`, {
          title: form.title,
          description: form.description,
          assigneeId: form.assigneeId || null,
          priority: form.priority,
          dueDate: form.dueDate,
        });
        onSaved(data.data.task);
      } else {
        const { data } = await api.post('/tasks', { ...form, assigneeId: form.assigneeId || null });
        onSaved(data.data.task);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && !fixedProjectId ? (
          <Field label="Project" htmlFor="t-project">
            <Select
              id="t-project"
              required
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value, assigneeId: '' })}
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-xs text-ink-muted">
            Project: <span className="font-medium text-ink-soft">{fixedProjectName || task?.project?.name}</span>
          </p>
        )}

        <Field label="Title" htmlFor="t-title">
          <Input
            id="t-title"
            required
            minLength={2}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>

        <Field label="Description" htmlFor="t-desc">
          <Textarea
            id="t-desc"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee" htmlFor="t-assignee">
            <Select
              id="t-assignee"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              disabled={!activeProjectId}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date" htmlFor="t-due">
            <Input
              id="t-due"
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Priority" htmlFor="t-priority">
          <Select
            id="t-priority"
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

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!activeProjectId}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
