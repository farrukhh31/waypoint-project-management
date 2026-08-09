import { Flag, MapPin, CheckCircle2, Users2 } from 'lucide-react';

const FEATURES = [
  'Real-time task tracking',
  'Role-based project portals',
  'Deadlines that keep themselves visible',
];

function layer(offset, depth) {
  return { transform: `translate3d(${offset.x * depth}px, ${offset.y * depth}px, 0)` };
}

function FloatingCard({ wrapStyle, floatClass, children }) {
  return (
    <div className="absolute" style={wrapStyle}>
      <div
        className={`rounded-xl border border-white/15 bg-white/10 px-3.5 py-3 shadow-2xl shadow-black/30 backdrop-blur-md ${floatClass}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The interactive left-panel "hero" for the auth screen — floating live
 * widget cards + a curved animated journey path, all riding the shared
 * pointer offset from AuthLayout for a 3D parallax feel. Depth values are
 * deliberately small (12-30px) so it reads as premium polish, not a
 * distraction from the actual form on the right.
 */
export default function BrandScene({ offset }) {
  return (
    <div className="relative flex flex-1 flex-col justify-between">
      {/* Floating logo badge */}
      <div
        className="absolute left-1/2 top-[8%] -translate-x-1/2"
        style={layer(offset, -16)}
      >
        <div className="animate-float-a rounded-2xl bg-white/10 p-3.5 shadow-2xl shadow-black/30 ring-1 ring-white/15 backdrop-blur-md">
          <img src="/favicon.svg" alt="" className="h-12 w-12" />
        </div>
      </div>

      {/* Floating widget: sprint progress */}
      <FloatingCard
        wrapStyle={{ top: '4%', right: '-2%', ...layer(offset, 26) }}
        floatClass="animate-float-b"
      >
        <p className="text-[11px] font-medium text-white/65">Sprint Progress</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-accent-400 to-accent-300" />
          </div>
          <span className="text-xs font-semibold text-accent-300">82%</span>
        </div>
      </FloatingCard>

      {/* Floating widget: checklist */}
      <FloatingCard
        wrapStyle={{ top: '46%', right: '-6%', ...layer(offset, 20) }}
        floatClass="animate-float-c"
      >
        <ul className="flex flex-col gap-1.5">
          {['Design review', 'Deploy staging'].map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-[11px] text-white/75">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-accent-400" />
              {t}
            </li>
          ))}
          <li className="flex items-center gap-1.5 text-[11px] text-white/40">
            <span className="h-3 w-3 shrink-0 rounded-full border border-white/30" />
            QA sign-off
          </li>
        </ul>
      </FloatingCard>

      {/* Floating widget: team presence */}
      <FloatingCard
        wrapStyle={{ bottom: '30%', left: '-4%', ...layer(offset, 22) }}
        floatClass="animate-float-b"
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {['A', 'J', 'M'].map((i) => (
              <span
                key={i}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-route-900 bg-route-500 text-[9px] font-semibold text-white"
              >
                {i}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            <Users2 className="h-3 w-3" /> 6 online
          </span>
        </div>
      </FloatingCard>

      {/* Headline block */}
      <div className="relative mt-24 max-w-sm">
        <h2 className="font-display text-3xl font-semibold leading-tight">
          Every project has a route.{' '}
          <span className="text-shimmer">Waypoint</span> keeps the team on it.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/85">
          Plan the work, assign the stops, and see exactly where every task
          sits between To Do and Completed.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-white/85">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-400" strokeWidth={2.25} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Curved animated journey path */}
      <div className="relative mt-10">
        <svg viewBox="0 0 400 50" className="w-full" preserveAspectRatio="none" aria-hidden="true">
          <path
            id="journey-path"
            d="M8,38 C90,10 160,48 240,18 S360,8 392,14"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
          <circle r="4" fill="#FF8C1A">
            <animateMotion dur="4.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#journey-path" />
            </animateMotion>
          </circle>
        </svg>
        <div className="mt-1 flex items-center justify-between text-xs text-white/65">
          <span className="flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" /> Projects
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Delivered
          </span>
        </div>
      </div>
    </div>
  );
}
