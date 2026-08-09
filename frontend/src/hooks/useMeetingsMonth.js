import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

function monthRange(monthDate) {
  const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function dayKey(isoString) {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Powers the meetings calendar: fetches every meeting in the visible
// month (via the existing GET /api/meetings?from=&to= agenda endpoint)
// and indexes them by day so the grid can mark which days have
// meetings without a request per cell.
export function useMeetingsMonth(monthDate) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = monthRange(monthDate);
      const { data } = await api.get('/meetings', { params: { from: from.toISOString(), to: to.toISOString() } });
      setMeetings(data.data.meetings ?? []);
    } finally {
      setLoading(false);
    }
  }, [monthDate.getFullYear(), monthDate.getMonth()]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = meetings.reduce((acc, meeting) => {
    const key = dayKey(meeting.startTime);
    (acc[key] ||= []).push(meeting);
    return acc;
  }, {});

  async function toggleReminder(meeting) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meeting.id ? { ...m, reminderEnabled: !m.reminderEnabled } : m))
    );
    try {
      await api.patch(`/meetings/${meeting.id}`, { reminderEnabled: !meeting.reminderEnabled });
    } catch {
      load();
    }
  }

  return { meetings, byDay, loading, toggleReminder, refetch: load };
}

export { dayKey };
