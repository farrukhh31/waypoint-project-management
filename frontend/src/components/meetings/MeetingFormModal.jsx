import { useEffect, useMemo, useState } from 'react';
import { Search, Users2, X } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input, { Textarea, Field } from '../ui/Input.jsx';
import Avatar from '../ui/Avatar.jsx';
import { MEETING_COLORS } from '../../config/meetingColors';

function toLocalInputValue(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultTimes(presetDate) {
  const start = presetDate ? new Date(presetDate) : new Date();
  if (!presetDate) {
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
  } else {
    start.setHours(9, 0, 0, 0);
  }
  const end = new Date(start.getTime() + 30 * 60000);
  return { start, end };
}

// Shared create/edit surface for meetings — used by the Meetings page (both
// personal agenda and, for admins/PMs, meetings you organize for others)
// and by the Admin meeting management page.
export default function MeetingFormModal({ open, onClose, onSaved, meeting, presetDate, currentUserId }) {
  const isEdit = Boolean(meeting);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [color, setColor] = useState('route');
  const [attendeeIds, setAttendeeIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSearch('');
    api.get('/users/assignable').then(({ data }) => setUsers(data.data.users ?? []));

    if (meeting) {
      setTitle(meeting.title || '');
      setDescription(meeting.description || '');
      setStartTime(toLocalInputValue(meeting.startTime));
      setEndTime(toLocalInputValue(meeting.endTime));
      setLocation(meeting.location || '');
      setMeetingLink(meeting.meetingLink || '');
      setColor(meeting.color || 'route');
      setAttendeeIds((meeting.attendees || []).map((a) => a.id));
    } else {
      const { start, end } = defaultTimes(presetDate);
      setTitle('');
      setDescription('');
      setStartTime(toLocalInputValue(start));
      setEndTime(toLocalInputValue(end));
      setLocation('');
      setMeetingLink('');
      setColor('route');
      setAttendeeIds(currentUserId ? [currentUserId] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meeting?.id, presetDate]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const selectedUsers = useMemo(
    () => users.filter((u) => attendeeIds.includes(u.id)),
    [users, attendeeIds]
  );

  function toggleAttendee(id) {
    if (id === currentUserId) return; // organizer always attends
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !startTime) return;
    setSaving(true);
    setError('');
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : null,
      location: location.trim() || null,
      meetingLink: meetingLink.trim() || null,
      color,
      attendeeIds,
    };
    try {
      if (isEdit) {
        const { data } = await api.patch(`/meetings/${meeting.id}`, payload);
        onSaved(data.data.meeting);
      } else {
        const { data } = await api.post('/meetings', payload);
        onSaved(data.data.meeting);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this meeting.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit meeting' : 'Schedule a meeting'} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sprint planning" autoFocus />
        </Field>

        <Field label="Description (optional)">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this meeting about?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="Ends">
            <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location (optional)">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room B / Video call" />
          </Field>
          <Field label="Meeting link (optional)">
            <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet…" />
          </Field>
        </div>

        <Field label="Color tag">
          <div className="flex items-center gap-2">
            {Object.entries(MEETING_COLORS).map(([key, tone]) => (
              <button
                key={key}
                type="button"
                onClick={() => setColor(key)}
                title={tone.label}
                className={clsx(
                  'h-7 w-7 rounded-full transition-all duration-150',
                  tone.dot,
                  color === key ? 'ring-2 ring-offset-2 ring-offset-surface scale-110' : 'opacity-60 hover:opacity-100',
                  color === key && tone.ring
                )}
              />
            ))}
          </div>
        </Field>

        <Field label={`Attendees${selectedUsers.length ? ` (${selectedUsers.length})` : ''}`}>
          <div className="flex flex-col gap-2 rounded-lg border border-line p-2.5">
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-line pb-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1.5 rounded-full bg-route-50 py-1 pl-1 pr-2 text-xs font-medium text-route-700"
                  >
                    <Avatar name={u.name} size="sm" />
                    {u.name}
                    {u.id !== currentUserId && (
                      <button type="button" onClick={() => toggleAttendee(u.id)} className="text-route-500 hover:text-route-700">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            <Input
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              className="h-9"
            />
            <div className="flex max-h-40 flex-col overflow-y-auto">
              {filteredUsers.length === 0 && (
                <p className="flex items-center gap-2 px-1 py-3 text-xs text-ink-muted">
                  <Users2 className="h-3.5 w-3.5" /> No one matches that search.
                </p>
              )}
              {filteredUsers.map((u) => (
                <label
                  key={u.id}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm text-ink-soft hover:bg-paper',
                    u.id === currentUserId && 'cursor-default opacity-70'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(u.id)}
                    disabled={u.id === currentUserId}
                    onChange={() => toggleAttendee(u.id)}
                  />
                  <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1 truncate">
                    {u.name} {u.id === currentUserId && <span className="text-xs text-ink-muted">(you)</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Field>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!title.trim() || !startTime}>
            {isEdit ? 'Save changes' : 'Schedule meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
