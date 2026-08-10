import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import Card from '../ui/Card.jsx';
import TiltCard from '../ui/TiltCard.jsx';
import { STAT_CARD_HEIGHT } from '../ui/StatCard.jsx';

// Radial equivalent of a StatCard — used for the one metric that reads
// better as a proportion than a raw count. Accent amber is the "current
// position" color everywhere else in the app, so it doubles as the fill
// here on purpose. Shares StatCard's fixed height so the whole stats row
// lines up regardless of each card's internal layout.
export default function CompletionRing({ label = 'Task completion', completed = 0, total = 0, to }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const card = (
    <Card
      className={clsx(
        'group relative flex items-center gap-4 overflow-hidden bg-gradient-to-br from-accent-400/[0.09] via-surface to-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop',
        STAT_CARD_HEIGHT
      )}
    >
      <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0 -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-line" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent-400 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">{pct}%</p>
        <p className="text-xs text-ink-muted">
          {completed} of {total} tasks
        </p>
      </div>
      {to && (
        <span className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-muted shadow-card transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-route-600">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      )}
    </Card>
  );

  const content = to ? (
    <Link to={to} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );

  return (
    <TiltCard maxTilt={5} className="block h-full rounded-lg">
      {content}
    </TiltCard>
  );
}
