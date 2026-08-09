import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';

// Ticks the displayed elapsed time client-side between server calls, but
// always re-derives it from the entry's own accumulatedSeconds/lastResumedAt
// (never a locally-incremented counter) so a backgrounded tab or a paused
// laptop can't drift the display out of sync with reality.
function computeElapsed(entry) {
  if (!entry) return 0;
  let elapsed = entry.accumulatedSeconds;
  if (entry.status === 'RUNNING' && entry.lastResumedAt) {
    elapsed += Math.floor((Date.now() - new Date(entry.lastResumedAt).getTime()) / 1000);
  }
  return Math.max(elapsed, 0);
}

export function useTimeEntry() {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const tickRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/time-entries/active');
      setEntry(data.data.entry);
      setElapsedSeconds(computeElapsed(data.data.entry));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (entry?.status === 'RUNNING') {
      tickRef.current = setInterval(() => setElapsedSeconds(computeElapsed(entry)), 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [entry]);

  async function start(label, { projectId, taskId } = {}) {
    const { data } = await api.post('/time-entries/start', { label, projectId, taskId });
    setEntry(data.data.entry);
    setElapsedSeconds(computeElapsed(data.data.entry));
  }

  async function pause() {
    if (!entry) return;
    const { data } = await api.post(`/time-entries/${entry.id}/pause`);
    setEntry(data.data.entry);
    setElapsedSeconds(computeElapsed(data.data.entry));
  }

  async function resume() {
    if (!entry) return;
    const { data } = await api.post(`/time-entries/${entry.id}/resume`);
    setEntry(data.data.entry);
    setElapsedSeconds(computeElapsed(data.data.entry));
  }

  async function stop() {
    if (!entry) return;
    await api.post(`/time-entries/${entry.id}/stop`);
    setEntry(null);
    setElapsedSeconds(0);
  }

  return { entry, loading, elapsedSeconds, start, pause, resume, stop };
}
