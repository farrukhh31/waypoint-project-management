import clsx from 'clsx';
import { MapPin, Check } from 'lucide-react';
import { TASK_STATUSES, TASK_STATUS_META } from '../../config/statuses';

// The product's signature element: a task's stages laid out as waypoints on
// a dotted route, with a pin marking the current stage. Reused wherever a
// task's progress needs to be legible at a glance (task rows, task detail).
export default function StatusTracker({ status, className }) {
  const currentIndex = TASK_STATUSES.indexOf(status);

  return (
    <div className={clsx('flex items-center', className)}>
      {TASK_STATUSES.map((stage, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2',
                  isCurrent && 'border-accent-400 bg-accent-400 text-white',
                  isDone && !isCurrent && 'border-success-400 bg-success-400 text-white',
                  !isCurrent && !isDone && 'border-line bg-surface text-ink-muted'
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <MapPin className="h-3.5 w-3.5" />
                ) : null}
              </div>
              <span
                className={clsx(
                  'whitespace-nowrap text-[11px] font-medium',
                  isCurrent ? 'text-ink' : 'text-ink-muted'
                )}
              >
                {TASK_STATUS_META[stage].label}
              </span>
            </div>
            {index < TASK_STATUSES.length - 1 && (
              <div className="route-line mx-1 h-px flex-1 translate-y-[-10px]" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
