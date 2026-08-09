import clsx from 'clsx';

const SIZES = {
  sm: { badge: 24, radius: 'rounded-[7px]', text: 'text-base' },
  md: { badge: 32, radius: 'rounded-[9px]', text: 'text-lg' },
  lg: { badge: 44, radius: 'rounded-xl', text: 'text-2xl' },
};

/**
 * The one place the Waypoint mark + wordmark get assembled. Use this
 * instead of reaching for /favicon.svg directly so every surface (auth
 * screen, sidebar, mobile header) renders the same lockup.
 *
 * `tone`: 'default' (ink text, for light surfaces), 'inverted' (white
 * text, for the dark auth brand panel), or 'gradient' (the shimmering
 * route->amber wordmark used on the mobile auth header).
 */
export default function Logo({ size = 'md', tone = 'default', withWordmark = true, className }) {
  const s = SIZES[size];

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <img
        src="/favicon.svg"
        alt="Waypoint"
        style={{ width: s.badge, height: s.badge }}
        className={clsx('shrink-0 shadow-lg shadow-black/15', s.radius)}
      />
      {withWordmark && (
        <span
          className={clsx(
            'font-display font-semibold tracking-tight',
            s.text,
            tone === 'gradient' &&
              'bg-gradient-to-r from-route-700 via-route-500 to-accent-500 bg-clip-text text-transparent',
            tone === 'inverted' && 'text-white',
            tone === 'default' && 'text-ink'
          )}
        >
          Waypoint
        </span>
      )}
    </div>
  );
}
