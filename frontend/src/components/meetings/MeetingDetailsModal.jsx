import { Clock, MapPin, Video, Bell, BellOff, Pencil, Trash2, Crown } from 'lucide-react';
import clsx from 'clsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import { meetingColor } from '../../config/meetingColors';

function formatRange(start, end) {
  const s = new Date(start);
  const dateLabel = s.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const startLabel = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (!end) return `${dateLabel} · ${startLabel}`;
  const endLabel = new Date(end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dateLabel} · ${startLabel} – ${endLabel}`;
}

// Read-only meeting detail view with the actions available to this viewer:
// everyone can mute/unmute their own reminder, only the organizer or an
// admin can edit or cancel.
export default function MeetingDetailsModal({ open, onClose, meeting, isAdmin, currentUserId, onEdit, onDelete, onToggleReminder }) {
  if (!meeting) return null;
  const tone = meetingColor(meeting.color);
  const canManage = isAdmin || meeting.isOrganizer;
  const startingSoon = typeof meeting.minutesUntil === 'number' && meeting.minutesUntil <= 15;

  return (
    <Modal open={open} onClose={onClose} title="Meeting details" className="max-w-lg">
      <div className="flex flex-col gap-5">
        <div className={clsx('rounded-xl bg-gradient-to-br p-4', tone.wash)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className={clsx('h-2.5 w-2.5 rounded-full', tone.dot)} />
                {startingSoon && (
                  <span className="animate-pulse rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Starting soon
                  </span>
                )}
              </div>
              <h4 className="truncate font-display text-lg font-semibold text-ink">{meeting.title}</h4>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                <Clock className="h-3.5 w-3.5 shrink-0" /> {formatRange(meeting.startTime, meeting.endTime)}
              </p>
            </div>
          </div>
        </div>

        {meeting.description && <p className="text-sm leading-relaxed text-ink-soft">{meeting.description}</p>}

        <div className="flex flex-col gap-2 text-sm">
          {meeting.location && (
            <div className="flex items-center gap-2 text-ink-soft">
              <MapPin className="h-4 w-4 shrink-0 text-ink-muted" /> {meeting.location}
            </div>
          )}
          {meeting.meetingLink && (
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-2 rounded-lg bg-route-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02]"
            >
              <Video className="h-4 w-4" /> Join meeting
            </a>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Attendees · {meeting.attendees.length}
          </p>
          <div className="flex flex-col gap-1.5">
            {meeting.attendees.map((a) => (
              <div key={a.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm">
                <Avatar name={a.name} src={a.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1 truncate text-ink-soft">
                  {a.name} {a.id === currentUserId && <span className="text-ink-muted">(you)</span>}
                </span>
                {a.id === meeting.organizer?.id && (
                  <span title="Organizer" className="flex items-center gap-1 text-xs font-medium text-accent-600">
                    <Crown className="h-3.5 w-3.5" /> Organizer
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onToggleReminder}
            className="flex items-center gap-1.5"
          >
            {meeting.reminderEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {meeting.reminderEnabled ? 'Reminder on' : 'Reminder off'}
          </Button>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onEdit} className="flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button type="button" variant="danger" onClick={onDelete} className="flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Cancel meeting
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
