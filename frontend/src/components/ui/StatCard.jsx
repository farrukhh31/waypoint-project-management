import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import Card from './Card.jsx';
import TiltCard from './TiltCard.jsx';

// Each accent gets a quiet gradient wash across the whole card (not just
// the icon chip) — reads as "premium" without needing a fake trend number
// we don't have the historical data to back up honestly.
const ACCENTS = {
  route: {
    card: 'bg-gradient-to-br from-route-50 via-surface to-surface',
    chip: 'bg-route-500 text-white shadow-route-500/30',
    ghost: 'border-route-200/70 bg-route-100/40',
  },
  accent: {
    card: 'bg-gradient-to-br from-accent-50 via-surface to-surface',
    chip: 'bg-accent-400 text-white shadow-accent-400/30',
    ghost: 'border-accent-200/70 bg-accent-100/40',
  },
  success: {
    card: 'bg-gradient-to-br from-success-50 via-surface to-surface',
    chip: 'bg-success-400 text-white shadow-success-400/30',
    ghost: 'border-success-200/70 bg-success-50',
  },
  danger: {
    card: 'bg-gradient-to-br from-danger-50 via-surface to-surface',
    chip: 'bg-danger-400 text-white shadow-danger-400/30',
    ghost: 'border-danger-200/70 bg-danger-50',
  },
  sky: {
    card: 'bg-gradient-to-br from-sky-50 via-surface to-surface',
    chip: 'bg-sky-400 text-white shadow-sky-400/30',
    ghost: 'border-sky-200/70 bg-sky-50',
  },
  teal: {
    card: 'bg-gradient-to-br from-teal-50 via-surface to-surface',
    chip: 'bg-teal-400 text-white shadow-teal-400/30',
    ghost: 'border-teal-200/70 bg-teal-50',
  },
};

// Fixed so every stat card in a row — StatCard or CompletionRing — matches
// exactly regardless of label length or whether a hint line is present.
export const STAT_CARD_HEIGHT = 'h-[136px]';

// Three tucked-in "ghost card" rectangles sitting quietly in the top-right
// corner at rest — same idea as the reference video's stat cards, which
// keep a stack of tilted mini mockup cards peeking from one corner and,
// on hover, fan them out toward the opposite corner. Kept inside the
// card's own bounds (overflow-hidden) rather than breaking out over the
// grid, so it doesn't disturb neighboring cards.
function GhostCardStack({ tone }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <div
        className={clsx(
          'absolute right-3 top-3 h-9 w-14 rotate-[10deg] rounded-md border shadow-sm opacity-0 transition-all duration-500 ease-out',
          'group-hover:-translate-x-[92px] group-hover:translate-y-[68px] group-hover:rotate-[-14deg] group-hover:opacity-70',
          tone.ghost
        )}
      />
      <div
        className={clsx(
          'absolute right-5 top-5 h-9 w-14 rotate-[-6deg] rounded-md border shadow-sm opacity-0 transition-all duration-500 ease-out delay-[60ms]',
          'group-hover:-translate-x-[104px] group-hover:translate-y-[52px] group-hover:rotate-[8deg] group-hover:opacity-80',
          tone.ghost
        )}
      />
      <div
        className={clsx(
          'absolute right-2 top-7 h-9 w-14 rotate-[3deg] rounded-md border shadow-sm opacity-0 transition-all duration-500 ease-out delay-[120ms]',
          'group-hover:-translate-x-[72px] group-hover:translate-y-[80px] group-hover:rotate-[-4deg] group-hover:opacity-90',
          tone.ghost
        )}
      />
    </div>
  );
}

export default function StatCard({ label, value, icon: Icon, accent = 'route', hint, tilt = false, to }) {
  const tones = ACCENTS[accent] || ACCENTS.route;

  const card = (
    <Card
      className={clsx(
        'group relative flex flex-col justify-between overflow-hidden p-5 transition-shadow duration-200 hover:shadow-pop',
        STAT_CARD_HEIGHT,
        tones.card
      )}
    >
      <GhostCardStack tone={tones} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{value ?? '—'}</p>
        </div>
        {Icon && (
          <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg', tones.chip)}>
            <Icon className="h-5 w-5" strokeWidth={2.25} />
          </div>
        )}
      </div>

      <div className="relative flex items-end justify-between">
        {hint ? <p className="text-xs text-ink-muted">{hint}</p> : <span />}
        {to && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-muted shadow-card transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-route-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </Card>
  );

  const content = to ? (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );

  if (!tilt) return content;
  return (
    <TiltCard maxTilt={5} className="block h-full rounded-lg">
      {content}
    </TiltCard>
  );
}
