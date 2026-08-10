import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';

const POLL_MS = 30 * 1000;
export const STARTING_SOON_MINUTES = 15;

// Lightweight poller (not socket-driven) for "what's starting soon" — used
// to drive the pulsing highlight on upcoming meetings and the banner strip
// at the top of the Meetings page. Persistent reminder notifications (bell
// icon + toast) are handled server-side by meetingReminderScheduler and
// pushed over the socket that NotificationContext already listens on; this
// hook is purely about live-highlighting meetings in the UI itself.
export function useUpcomingMeetings(withinMinutes = 120) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await api.get('/meetings/upcoming', { params: { withinMinutes } });
        if (!cancelled) setMeetings(data.data.meetings ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [withinMinutes]);

  const startingSoon = meetings.filter((m) => m.minutesUntil <= STARTING_SOON_MINUTES);

  return { meetings, startingSoon, loading };
}
