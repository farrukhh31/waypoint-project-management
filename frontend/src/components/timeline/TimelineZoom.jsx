import clsx from 'clsx';
import { ZOOM_LEVELS } from '../../utils/timelineScale';

export default function TimelineZoom({ zoom, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5">
      {Object.entries(ZOOM_LEVELS).map(([key, level]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={clsx(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            zoom === key ? 'bg-route-500 text-white shadow-sm' : 'text-ink-muted hover:bg-paper hover:text-ink'
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
