import clsx from 'clsx';

// Renders a status/priority pill from the metadata maps in config/statuses.js
// e.g. <Badge meta={TASK_STATUS_META[task.status]} />
export default function Badge({ meta, className }) {
  if (!meta) return null;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
