import { Plus } from 'lucide-react';
import clsx from 'clsx';

// A dashed, "premium" call-to-action tile — sits alongside real cards (the
// first tile in the Projects grid, or a closing row under a task list) and
// invites the person to create the next one. Deliberately quieter than a
// solid Button at rest, but comes alive on hover: lifts, brightens its
// border/wash, and the plus icon spins into a full turn.
export default function AddCardTile({ label, sublabel, onClick, style, className, dense = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={clsx(
        'group relative flex w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-lg border-2 border-dashed border-line bg-surface/60 text-center transition-all duration-300',
        'hover:-translate-y-1 hover:border-route-300 hover:bg-route-50/60 hover:shadow-pop',
        'focus-visible:-translate-y-1 focus-visible:border-route-300 focus-visible:bg-route-50/60',
        dense ? 'h-16 flex-row gap-3 px-5' : 'h-full min-h-[220px] p-6',
        className
      )}
    >
      {/* Quiet ambient wash that blooms in on hover, same language as ProjectCard */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-route-100/0 via-transparent to-accent-100/0 opacity-0 transition-opacity duration-300 group-hover:from-route-100/40 group-hover:to-accent-100/30 group-hover:opacity-100"
        aria-hidden="true"
      />
      <span
        className={clsx(
          'relative flex shrink-0 items-center justify-center rounded-full bg-route-100 text-route-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-90 group-hover:bg-route-500 group-hover:text-white group-hover:shadow-route-500/30',
          !dense && 'animate-cta-glow',
          dense ? 'h-9 w-9' : 'h-12 w-12'
        )}
      >
        <Plus className={dense ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.5} />
      </span>
      <span className="relative flex flex-col">
        <span className="font-display text-sm font-semibold text-ink-soft transition-colors duration-200 group-hover:text-route-700">
          {label}
        </span>
        {sublabel && <span className="text-xs text-ink-muted">{sublabel}</span>}
      </span>
    </button>
  );
}
