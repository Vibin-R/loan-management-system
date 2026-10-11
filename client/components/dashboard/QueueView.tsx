'use client';

import type { Paginated } from '@/lib/types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { SearchIcon } from '@/components/ui/icons';

interface QueueViewProps<T> {
  list: {
    data: Paginated<T> | null;
    page: number;
    setPage: (page: number) => void;
    search: string;
    setSearch: (value: string) => void;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
  };
  searchPlaceholder: string;
  emptyTitle: string;
  emptyText: string;
  /** Extra controls next to the search box, e.g. filter chips. */
  toolbar?: React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
  itemKey: (item: T) => string;
}

/**
 * Shared frame for every module queue: search, loading skeleton, error with retry,
 * empty state, the rows themselves, and pagination.
 */
export function QueueView<T>({
  list,
  searchPlaceholder,
  emptyTitle,
  emptyText,
  toolbar,
  renderItem,
  itemKey,
}: QueueViewProps<T>) {
  const { data, loading, error } = list;
  const searching = list.search.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-60">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        {toolbar}
        {data && (
          <span className="rounded-full border border-border px-3 py-1.5 text-sm text-muted">
            {data.total} {data.total === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {error && (
        <div className="space-y-3">
          <Alert>{error}</Alert>
          <Button variant="secondary" onClick={() => void list.reload()}>
            Try again
          </Button>
        </div>
      )}

      {!error && loading && !data && <SkeletonRows />}

      {!error && data && data.items.length === 0 && (
        <div className="animate-fade-in rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">{searching ? 'No matches' : emptyTitle}</p>
          <p className="mt-1 text-sm text-muted">
            {searching ? 'Try a different name, email or PAN.' : emptyText}
          </p>
        </div>
      )}

      {!error && data && data.items.length > 0 && (
        <ul
          className={`animate-fade-in divide-y divide-border border-y border-border transition-opacity ${loading ? 'opacity-60' : ''}`}
        >
          {data.items.map((item) => (
            <li key={itemKey(item)}>{renderItem(item)}</li>
          ))}
        </ul>
      )}

      {data && (
        <Pagination
          page={list.page}
          limit={data.limit}
          total={data.total}
          onPageChange={list.setPage}
        />
      )}
    </div>
  );
}
