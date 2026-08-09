import clsx from 'clsx';

/**
 * Waypoint's branded loading indicator.
 *
 * Built around the same "progress along a route" idea as the rest of
 * the product, instead of a generic spinner:
 *   - a slow dashed "compass bezel" ring (echoes the dotted route-line
 *     motif used in status trackers throughout the app)
 *   - a smooth gradient arc riding just inside it, giving the piece its
 *     motion — this is the one place a rotating ring is the right call,
 *     since a circle has no corners to look awkward mid-spin (unlike the
 *     old rectangular auth-card ring)
 *   - the logo badge stays still at the center with a soft breathing
 *     glow, so it reads clearly instead of spinning past legibility
 *   - a small three-dot "waypoint" wave under the label for a bit of
 *     extra life on longer waits
 */
const SIZE_MAP = {
  sm: { box: 56, ring: 44, logo: 20, stroke: 2.5, bezelGap: 7 },
  md: { box: 76, ring: 60, logo: 28, stroke: 3, bezelGap: 8 },
  lg: { box: 108, ring: 84, logo: 40, stroke: 3.5, bezelGap: 10 },
};

export default function RouteLoader({ size = 'md', label, className }) {
  const s = SIZE_MAP[size];
  const c = s.box / 2;
  const r = s.ring / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = circumference * 0.26;

  return (
    <div className={clsx('flex flex-col items-center gap-4', className)}>
      <div className="relative shrink-0" style={{ width: s.box, height: s.box }}>
        {/* Ambient glow — breathes behind the mark, never spins */}
        <span
          className="animate-glow-pulse absolute inset-0 rounded-full bg-route-400/30 blur-xl"
          aria-hidden="true"
        />

        <svg width={s.box} height={s.box} viewBox={`0 0 ${s.box} ${s.box}`} className="relative block">
          <defs>
            <linearGradient id="wp-loader-arc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5B4FE0" />
              <stop offset="55%" stopColor="#FF8C1A" />
              <stop offset="100%" stopColor="#5B4FE0" />
            </linearGradient>
          </defs>

          {/* Dashed compass bezel — slow, steady rotation */}
          <circle
            cx={c}
            cy={c}
            r={r + s.stroke + s.bezelGap}
            fill="none"
            stroke="#AECBE3"
            strokeWidth="1"
            strokeDasharray="1 7"
            strokeLinecap="round"
            style={{ transformOrigin: '50% 50%', animation: 'wp-spin 22s linear infinite' }}
          />

          {/* Track */}
          <circle cx={c} cy={c} r={r} fill="none" stroke="#EEF4FA" strokeWidth={s.stroke} />

          {/* Gradient progress arc */}
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="url(#wp-loader-arc)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            style={{ transformOrigin: '50% 50%', animation: 'wp-spin-arc 1.3s cubic-bezier(.65,0,.35,1) infinite' }}
          />
        </svg>

        {/* Static center badge */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center justify-center rounded-full bg-surface shadow-md ring-1 ring-line/60" style={{ width: s.logo + 16, height: s.logo + 16 }}>
            <img src="/favicon.svg" alt="" style={{ width: s.logo, height: s.logo }} className="rounded-[7px]" />
          </span>
        </span>
      </div>

      {label && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-ink-soft">{label}</p>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="animate-wave-dot h-1.5 w-1.5 rounded-full bg-accent-400"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
