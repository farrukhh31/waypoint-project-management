import clsx from 'clsx';

// Simple controlled boolean toggle — a rounded track with a sliding thumb.
// Used anywhere a setting is a plain on/off (notification preferences,
// feature toggles) rather than a multi-option choice (see TimelineSwitch).
export default function Switch({ checked, onChange, disabled = false, label, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-500',
        checked ? 'bg-route-500' : 'bg-ink-muted/25',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <span
        className={clsx(
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-card transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-1'
        )}
      />
    </button>
  );
}
