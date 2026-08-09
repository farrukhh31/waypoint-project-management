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
    <div className={clsx('flex items-center justify-between border-b border-line px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={clsx('p-5', className)} {...props}>
      {children}
    </div>
  );
}
