import { Clock, Video } from 'lucide-react';
import clsx from 'clsx';
import { meetingColor } from '../../config/meetingColors';

// Horizontal strip of meetings starting within the next 15 minutes. Cards
// for meetings starting within 5 minutes get a color-pulse animation (see
// `.meeting-blink` in index.css) so the "about to start" moment is hard to
// miss without being a full pop-up interruption.
export default function UpcomingMeetingBanner({ meetings, onSelect }) {
  if (!meetings.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Clock className="h-3.5 w-3.5" /> Starting soon
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {meetings.map((m) => {
          const tone = meetingColor(m.color);
          const imminent = m.minutesUntil <= 5;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className={clsx(
                'flex min-w-[220px] shrink-0 flex-col gap-1.5 rounded-xl border p-3.5 text-left shadow-sm transition-transform hover:-translate-y-0.5',
                'border-line bg-surface',
                imminent && 'meeting-blink'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={clsx('h-2 w-2 rounded-full', tone.dot)} />
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    imminent ? 'bg-danger-500 text-white' : 'bg-paper text-ink-muted'
                  )}
                >
                  {m.minutesUntil <= 1 ? 'Now' : `${m.minutesUntil} min`}
                </span>
              </div>
              <p className="truncate font-display text-sm font-semibold text-ink">{m.title}</p>
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                {m.meetingLink ? <Video className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {new Date(m.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
