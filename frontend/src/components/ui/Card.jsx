import clsx from 'clsx';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx('rounded-lg border border-line bg-surface shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5 sm:py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={clsx('p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  );
}
