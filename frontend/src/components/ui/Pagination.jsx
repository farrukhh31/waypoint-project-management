import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

// Fits the { page, limit, total, pages } shape returned by the backend's
// paginationMeta() helper on every list endpoint.
export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total } = pagination;

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-ink-muted">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
