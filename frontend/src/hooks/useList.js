import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

// Fits the shared list-endpoint contract described in the backend README:
// GET <endpoint>?search=&...filters&sortBy=&order=&page=&limit=
// -> { success, data: { <itemsKey>: [...], pagination } }
export function useList(endpoint, itemsKey, params = {}, deps = []) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );

    api
      .get(endpoint, { params: cleanParams })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data[itemsKey] ?? []);
        setPagination(res.data.data.pagination ?? null);
        // Anything the endpoint returns beyond the items/pagination pair —
        // e.g. Projects' `statusCounts` — for callers that want it without
        // every list endpoint needing to agree on a shape for it.
        const { [itemsKey]: _items, pagination: _pagination, ...rest } = res.data.data;
        setMeta(rest);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadIndex]);

  // Lets a page re-run its list fetch after a create/edit/delete without
  // needing to duplicate the endpoint/params logic at the call site.
  const refetch = useCallback(() => setReloadIndex((i) => i + 1), []);

  return { items, pagination, meta, loading, error, refetch };
}
