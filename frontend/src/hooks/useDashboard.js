import { useEffect, useState } from 'react';
import api from '../lib/api';

// GET /api/dashboard adapts its shape to req.user.role (see backend
// dashboardController) — this hook just fetches and exposes it as-is.
export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/dashboard')
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
  }, []);

  return { data, loading, error };
}
