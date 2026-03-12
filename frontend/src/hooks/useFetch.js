/**
 * hooks/useFetch.js
 * ─────────────────────────────────────────────────────────
 * Reusable data-fetching hook.
 *
 * Handles: loading state, error state, data state, and refetch.
 * Every list page (Items, Borrowings, Logs, etc.) uses this.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch(items.list, { status: 'active' });
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';

export function useFetch(fetchFn, params = {}, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Serialize params to detect changes (objects aren't equal by reference)
  const paramStr = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(params);
      // Laravel returns paginated data under res.data.data, or plain under res.data
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramStr, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
