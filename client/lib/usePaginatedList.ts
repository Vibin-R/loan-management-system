'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ListParams, Paginated } from './types';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Loads a server-paginated list with search. Typing resets to page 1 and waits briefly before
 * querying, so the server isn't hit on every keystroke. `reload()` refreshes the current page,
 * e.g. after an action removes a row.
 */
export function usePaginatedList<T>(
  fetchPage: (params: ListParams) => Promise<Paginated<T>>,
  /** Changing this (e.g. a filter) restarts from page 1. */
  filterKey = '',
) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [filterKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage({ page, search: debouncedSearch });
      // If the last row on a later page was just actioned, step back a page.
      if (result.items.length === 0 && page > 1) setPage(page - 1);
      else setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this list.');
    } finally {
      setLoading(false);
    }
  }, [fetchPage, page, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, page, setPage, search, setSearch, loading, error, reload: load };
}
