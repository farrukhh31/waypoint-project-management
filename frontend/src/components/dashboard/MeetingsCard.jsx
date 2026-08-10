import { useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Card, { CardHeader, CardBody } from '../ui/Card.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { useMeetingsMonth, dayKey } from '../../hooks/useMeetingsMonth';
import { formatTime } from '../../utils/formatDate';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={clsx(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-route-500' : 'bg-line'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

// Builds a 6-row Sun-first month grid, padding with the trailing days of
// the previous month and leading days of the next so every week is full.
function buildGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

export default function MeetingsCard({ basePath }) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const { byDay, loading, toggleReminder } = useMeetingsMonth(visibleMonth);

  const grid = buildGrid(visibleMonth);
  const selectedMeetings = (byDay[dayKey(selectedDate)] || []).slice().sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const isSameMonth = (d) => d.getMonth() === visibleMonth.getMonth();
  const isToday = (d) => d.toDateString() === today.toDateString();
  const isSelected = (d) => d.toDateString() === selectedDate.toDateString();

  function shiftMonth(delta) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1);
    setVisibleMonth(next);
    setSelectedDate(next);
  }

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-pop">
      <CardHeader className="bg-gradient-to-r from-route-400/10 via-surface to-surface">
        <h3 className="font-display text-base font-semibold text-ink">Meetings</h3>
        {basePath ? (
          <Link to={`${basePath}/meetings`} className="text-xs font-medium text-route-600 hover:underline">
            View all
          </Link>
        ) : (
          <CalendarClock className="h-4 w-4 text-ink-muted" />
        )}
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <div className="rounded-lg border border-line bg-paper/60 p-3 shadow-[inset_0_1px_2px_rgba(18,23,43,0.04)]">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-display text-sm font-semibold text-ink">
              {visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                {d}
              </span>
            ))}
            {grid.map((date) => {
              const hasMeetings = (byDay[dayKey(date)] || []).length > 0;
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={clsx(
                    'relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all duration-150',
                    !isSameMonth(date) && 'text-ink-muted/40',
                    isSameMonth(date) && !isSelected(date) && 'text-ink-soft hover:bg-surface hover:shadow-card',
                    isSelected(date) && 'bg-route-500 text-white shadow-pop -translate-y-px',
                    !isSelected(date) && isToday(date) && 'font-semibold text-route-600 ring-1 ring-route-300'
                  )}
                >
                  {date.getDate()}
                  {hasMeetings && (
                    <span
                      className={clsx(
                        'absolute -bottom-1 h-1 w-1 rounded-full',
                        isSelected(date) ? 'bg-white' : 'bg-accent-400'
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ink-muted">
            {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-line/40" />
              ))}
            </div>
          ) : selectedMeetings.length === 0 ? (
            <EmptyState title="Nothing scheduled" description="No meetings on this day." />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {selectedMeetings.map((meeting) => (
                <li key={meeting.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="w-16 shrink-0">
                    <p className="text-sm font-medium text-ink">{formatTime(meeting.startTime)}</p>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-ink-soft">{meeting.title}</p>
                  <Toggle checked={meeting.reminderEnabled} onChange={() => toggleReminder(meeting)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
