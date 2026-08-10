import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

// Paginated history list (GET /api/time-entries?page=&limit=), plus the
// per-row edit/delete actions the Time Tracking page's history table needs.
export function useTimeEntries({ page = 1, limit = 10 } = {}) {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadIndex, setReloadIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/time-entries', { params: { page, limit } });
      setEntries(data.data.entries ?? []);
      setPagination(data.data.pagination ?? null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadIndex]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => setReloadIndex((i) => i + 1), []);

  async function updateEntry(id, payload) {
    await api.patch(`/time-entries/${id}`, payload);
    refetch();
  }

  async function deleteEntry(id) {
    await api.delete(`/time-entries/${id}`);
    refetch();
  }

  return { entries, pagination, loading, refetch, updateEntry, deleteEntry };
}

// GET /api/time-entries/stats — today/week/month totals plus a per-project
// breakdown, for the Time Tracking page's stat cards and mini chart.
export function useTimeStats(reloadKey) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/time-entries/stats')
      .then(({ data }) => {
        if (!cancelled) setStats(data.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { stats, loading };
}
