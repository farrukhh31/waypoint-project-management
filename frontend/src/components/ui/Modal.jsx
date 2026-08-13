import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

// Simple controlled modal: no portal library needed since the app has no
// nested-scroll containers that would clip a fixed-position overlay.
export default function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={clsx(
          'flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-line bg-surface shadow-pop animate-modal-pop',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3.5 sm:px-5 sm:py-4">
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-muted transition-colors hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-hover overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
