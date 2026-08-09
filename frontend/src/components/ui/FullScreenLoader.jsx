import RouteLoader from './RouteLoader.jsx';

/**
 * Full-page loading state — used for the app boot check and per-page
 * data fetches. Gives RouteLoader a bit of ambient staging (faint dot
 * grid + a soft glow, matching the auth screen's language) instead of
 * dropping it on a flat background, and fades in so it never feels like
 * a jump-cut. Paired with useMinDuration at the call sites so it holds
 * long enough to actually register.
 */
export default function FullScreenLoader({ label = 'Loading Waypoint…' }) {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-paper">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(30,41,59,0.55) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-route-300/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative animate-[fade-in-up_0.4s_ease-out]">
        <RouteLoader size="lg" label={label} />
      </div>
    </div>
  );
}
