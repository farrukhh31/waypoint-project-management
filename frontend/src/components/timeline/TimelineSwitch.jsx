import clsx from 'clsx';

// A tactile, slightly-3D segmented control — the pill behind the active
// label sits on a recessed track (inset shadow) so the active segment
// reads as physically "pressed in" rather than just color-flipped.
export default function TimelineSwitch({ views, active, onChange }) {
  return (
    <div
      className="relative inline-flex items-center gap-0.5 rounded-xl border border-line bg-paper p-1 shadow-[inset_0_1px_3px_rgba(18,23,43,0.08)]"
      role="tablist"
      aria-label="Timeline view"
    >
      {views.map((view) => {
        const isActive = view.key === active;
        return (
          <button
            key={view.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view.key)}
            className={clsx(
              'relative z-10 flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
              isActive ? 'bg-surface text-route-700 shadow-pop' : 'text-ink-muted hover:text-ink'
            )}
            style={isActive ? { transform: 'translateY(-1px)' } : undefined}
          >
            <view.icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
