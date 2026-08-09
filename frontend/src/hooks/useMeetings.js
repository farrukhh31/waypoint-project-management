import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export function useMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings/today');
      setMeetings(data.data.meetings ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleReminder(meeting) {
    // Optimistic — the toggle should feel instant, and a failed PATCH is
    // rare enough that a full refetch on catch is an acceptable fallback.
    setMeetings((prev) =>
      prev.map((m) => (m.id === meeting.id ? { ...m, reminderEnabled: !m.reminderEnabled } : m))
    );
    try {
      await api.patch(`/meetings/${meeting.id}`, { reminderEnabled: !meeting.reminderEnabled });
    } catch {
      load();
    }
  }

  return { meetings, loading, toggleReminder, refetch: load };
}
