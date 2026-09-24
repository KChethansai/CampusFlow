// usePager: page state + fetch helper for paginated list endpoints.
// Backend shape: { success, data, pagination: { page, limit, total, pages } }.
import { useState } from 'react';
import { btnClass } from '../system/tokens';

export function usePager(initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState({ page: initialPage, limit: 0, total: 0, pages: 1 });

  // Pull items out of a paginated response body and sync pager state.
  const readPage = (body) => {
    if (body?.pagination) setPagination(body.pagination);
    return body?.data || [];
  };

  const prev = () => setPage((p) => Math.max(p - 1, 1));
  const next = () =>
    setPage((p) => (pagination.pages ? Math.min(p + 1, pagination.pages) : p + 1));

  return { page, setPage, pagination, readPage, prev, next };
}

export function PagerControls({ pagination, onPrev, onNext }) {
  const { page, limit, total, pages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--cf-ink-mute)]">
      <p className="tabular-nums" aria-live="polite">
        Showing {start}&ndash;{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className={btnClass('secondary', 'small')}
        >
          Prev
        </button>
        <span className="tabular-nums" aria-label={`Page ${page} of ${pages}`}>
          {page} / {pages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= pages}
          className={btnClass('secondary', 'small')}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default usePager;
