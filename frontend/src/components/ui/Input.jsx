import clsx from 'clsx';

export default function Input({ className, error, icon: Icon, ...props }) {
  if (Icon) {
    return (
      <div className="group relative">
        <Icon
          className={clsx(
            'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
            error ? 'text-danger-400' : 'text-ink-muted group-focus-within:text-route-500'
          )}
        />
        <input
          className={clsx(
            'h-11 w-full rounded-lg border bg-surface pl-9 pr-3 text-base text-ink placeholder:text-ink-muted sm:text-sm',
            'transition-shadow duration-150',
            'focus:border-route-500 focus:outline-none focus:ring-4 focus:ring-route-500/10',
            error ? 'border-danger-400' : 'border-line',
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={clsx(
        'h-10 w-full rounded border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted',
        'focus:border-route-500 focus:outline-none focus:ring-1 focus:ring-route-500',
        error ? 'border-danger-400' : 'border-line',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, error, ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full resize-y rounded border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted',
        'focus:border-route-500 focus:outline-none focus:ring-1 focus:ring-route-500',
        error ? 'border-danger-400' : 'border-line',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, error, children, ...props }) {
  return (
    <select
      className={clsx(
        'h-10 w-full rounded border bg-surface px-3 text-sm text-ink',
        'focus:border-route-500 focus:outline-none focus:ring-1 focus:ring-route-500',
        error ? 'border-danger-400' : 'border-line',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, htmlFor, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
