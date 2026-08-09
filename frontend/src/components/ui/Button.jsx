import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-route-500 text-white hover:bg-route-600 disabled:bg-route-300',
  secondary: 'bg-surface text-ink border border-line hover:bg-paper',
  danger: 'bg-danger-400 text-white hover:bg-danger-600',
  ghost: 'text-ink-soft hover:bg-ink/5',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
