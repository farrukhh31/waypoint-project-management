import { useEffect, useState } from 'react';
import api from '../lib/api';

// GET /api/dashboard/activity?days=7|14|30 — admin-only, real ActivityLog
// data bucketed per day (see backend dashboardController#getActivityTrend).
// Re-fetches whenever `days` changes, so a range toggle in the UI drives a
// real backend query rather than slicing a fixed 7-day payload client-side.
export function useActivityTrend(days = 7) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/dashboard/activity', { params: { days } })
      .then((res) => {
        if (!cancelled) setData(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return { data, loading, error };
}
