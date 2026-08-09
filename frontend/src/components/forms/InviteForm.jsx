import { useState } from 'react';
import { Check, Copy, MailPlus } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Input, { Field, Select } from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { ROLES, ROLE_LABELS } from '../../config/roles';

export default function InviteForm({ open, onClose, onSent, fixedProjectId = null, fixedProjectName = '' }) {
  const emptyForm = { email: '', role: ROLES.TEAM_MEMBER };
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentLink, setSentLink] = useState(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setForm(emptyForm);
    setError('');
    setSentLink(null);
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const payload = fixedProjectId ? { ...form, projectId: fixedProjectId } : form;
      const { data } = await api.post('/invites', payload);
      setSentLink(data.data.inviteLink);
      onSent?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the invite.');
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(sentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the link is still selectable/visible in the box.
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={fixedProjectId ? `Invite to ${fixedProjectName}` : 'Invite a user'}>
      {sentLink ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-success-50 px-3.5 py-3 text-sm text-success-600">
            <MailPlus className="h-4 w-4 shrink-0" />
            Invite created for <span className="font-medium">{form.email}</span>.
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-soft">Invite link</p>
            <p className="mb-2 text-xs text-ink-muted">
              An email is on its way to them. If it doesn't arrive, you can share this link
              directly instead.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-line bg-paper px-3 py-2.5 text-xs text-ink-soft">
                {sentLink}
              </code>
              <Button type="button" variant="secondary" size="sm" onClick={copyLink}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={reset}>
              Invite another
            </Button>
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            {fixedProjectId
              ? `They'll get a link to set their own password and join ${fixedProjectName} as a Team Member.`
              : "They'll get a link to set their own password and join with the role you choose here."}
          </p>

          <Field label="Email address" htmlFor="inv-email">
            <Input
              id="inv-email"
              type="email"
              required
              autoFocus
              placeholder="teammate@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>

          {fixedProjectId ? (
            <Field label="Role" htmlFor="inv-role">
              <Input id="inv-role" value={ROLE_LABELS[ROLES.TEAM_MEMBER]} disabled />
              <p className="text-xs text-ink-muted">
                Invites you send are always Team Members on {fixedProjectName}.
              </p>
            </Field>
          ) : (
            <Field label="Role" htmlFor="inv-role">
              <Select id="inv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {error && <p className="text-sm text-danger-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={sending}>
              Send invite
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}