import { CheckCircle2, Users2 } from 'lucide-react';
import Logo from '../ui/Logo.jsx';

/**
 * Compact brand identity shown in place of the full BrandScene on
 * screens below `lg`, where the split-screen panel is hidden. Keeps a
 * taste of the "live product" feel (shimmering wordmark + a couple of
 * live-looking stat chips) without the weight of the full 3D scene.
 */
export default function MobileHero() {
  return (
    <div className="relative mb-7 flex flex-col items-center text-center lg:hidden">
      {/* Soft golden halo behind the mobile wordmark, matching the
          desktop card's golden border/glow treatment. */}
      <div
        className="pointer-events-none absolute -top-3 h-20 w-40 rounded-full bg-accent-300/30 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <Logo size="lg" tone="gradient" />
      </div>
      <p className="mt-2 text-xs text-ink-muted">Every project has a route.</p>

      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft shadow-sm">
          <CheckCircle2 className="h-3 w-3 text-accent-500" /> Sprint 82%
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft shadow-sm">
          <Users2 className="h-3 w-3 text-route-500" /> 6 online
        </span>
      </div>
    </div>
  );
}
