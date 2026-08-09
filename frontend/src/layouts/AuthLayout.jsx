import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { usePointerParallax } from '../hooks/usePointerParallax';
import BrandScene from '../components/auth/BrandScene.jsx';
import FormBackdrop from '../components/auth/FormBackdrop.jsx';
import MobileHero from '../components/auth/MobileHero.jsx';
import Logo from '../components/ui/Logo.jsx';

/**
 * Waypoint's auth shell — a shared pointer offset (usePointerParallax)
 * drives both the left brand scene's floating cards and a subtle 3D tilt
 * on the right-side glass form card, so the whole screen feels like one
 * interactive stage rather than two separate effects. Falls back to a
 * fully static layout on touch devices / prefers-reduced-motion.
 */
export default function AuthLayout() {
  const { ref, offset } = usePointerParallax();

  const cardTilt = {
    transform: `perspective(1400px) rotateX(${(-offset.y * 4).toFixed(2)}deg) rotateY(${(offset.x * 4).toFixed(2)}deg)`,
  };

  return (
    <div ref={ref} className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-route-50 via-paper to-paper">
      {/* Ambient glow, page-wide */}
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-route-300/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Brand panel — hidden on small screens */}
      <div className="relative hidden w-[46%] flex-col overflow-hidden bg-route-900 px-10 py-10 text-white lg:flex">
        {/* Faint dotted texture + inner glows */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-route-500/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <Logo size="md" tone="inverted" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col">
          <BrandScene offset={offset} />
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
        <FormBackdrop offset={offset} />

        <div className="relative z-10 w-full max-w-sm animate-[fade-in-up_0.4s_ease-out]">
          <MobileHero />

          {/* Compact logo above the card on desktop — the brand panel has
              its own Logo, but the white side reads as a bare form without
              one of its own here. */}
          <div className="mb-6 hidden items-center gap-2.5 lg:flex">
            <Logo size="sm" tone="default" />
          </div>

          {/* Glass card, tilts with the shared pointer offset */}
          <div className="relative rounded-2xl">
            {/* Ambient glow — breathes softly behind the card, never spins.
                Golden-forward now so the form side reads as the "warm"
                counterpart to the deep blue brand panel. */}
            <div
              className="animate-glow-pulse pointer-events-none absolute -inset-4 rounded-[28px] bg-gradient-to-br from-accent-300/35 via-route-300/20 to-accent-400/35 blur-2xl"
              aria-hidden="true"
            />
            {/* Hairline gradient border — golden hairline, brand blue at the edges */}
            <div
              className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-accent-300/90 via-accent-200/70 to-route-400/70"
              aria-hidden="true"
            />
            <div
              className="relative overflow-hidden rounded-2xl border border-accent-200/50 bg-surface/95 p-6 shadow-2xl shadow-accent-900/10 backdrop-blur-xl transition-transform duration-150 ease-out will-change-transform sm:p-9"
              style={cardTilt}
            >
              <span
                className="animate-border-shimmer pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-500 via-accent-200 to-accent-500"
                aria-hidden="true"
              />
              {/* Small golden waypoint-marker badge, top-right — the one
                  recurring "gold" motif from the brand panel, echoed here
                  on the white side so the two halves feel like one theme. */}
              <span
                className="pointer-events-none absolute right-5 top-5 h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_0_4px] shadow-accent-100"
                aria-hidden="true"
              />
              <Outlet />
            </div>
          </div>

          {/* Small brand footer — grounds the white side with a bit of
              text/logo presence below the card, on mobile and desktop. */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-500" aria-hidden="true" />
            <span>Waypoint &middot; encrypted sessions, always</span>
          </div>
        </div>
      </div>
    </div>
  );
}
