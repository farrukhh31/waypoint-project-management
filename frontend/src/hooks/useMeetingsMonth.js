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

// Powers both the dashboard calendar widget and the full Meetings page:
// fetches every meeting in the visible month (GET /api/meetings?from=&to=)
// and indexes them by day so the grid can mark which days have meetings
// without a request per cell. Also exposes full CRUD so the Meetings page
// doesn't need a second hook just to create/edit/delete.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await api.patch(`/meetings/${meeting.id}/reminder`, { reminderEnabled: !meeting.reminderEnabled });
    } catch {
      load();
    }
  }

  async function createMeeting(payload) {
    const { data } = await api.post('/meetings', payload);
    await load();
    return data.data.meeting;
  }

  async function updateMeeting(id, payload) {
    const { data } = await api.patch(`/meetings/${id}`, payload);
    await load();
    return data.data.meeting;
  }

  async function deleteMeeting(id) {
    await api.delete(`/meetings/${id}`);
    await load();
  }

  return { meetings, byDay, loading, toggleReminder, createMeeting, updateMeeting, deleteMeeting, refetch: load };
}

export { dayKey };
