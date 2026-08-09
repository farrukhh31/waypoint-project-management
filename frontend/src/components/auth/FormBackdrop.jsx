function layer(offset, depth) {
  return { transform: `translate3d(${offset.x * depth}px, ${offset.y * depth}px, 0)` };
}

/**
 * Ambient backdrop for the auth form side. Built around the same "route"
 * vocabulary as the rest of the product (dotted lines, waypoint markers)
 * instead of generic decoration:
 *   - a large, very faint contour map traced in dashes, like the paper
 *     backing of a route planner
 *   - a slow-drifting two-tone aurora mesh (route blue + amber) for depth
 *   - a cursor-follow spotlight tying the panel to the shared parallax
 *   - a single soft compass rose watermark, off-center, at low opacity
 * Everything here is a translate/opacity animation — nothing rotates the
 * way the old conic-gradient ring did, so it reads as premium ambience
 * rather than a spinning shape.
 */
export default function FormBackdrop({ offset }) {
  // Spotlight follows the cursor: offset is -1..1, map to a 0-100% position.
  const spotX = 50 + offset.x * 30;
  const spotY = 50 + offset.y * 30;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Slow-drifting aurora mesh, contained so it never forces scroll */}
      <div
        className="animate-aurora-a absolute -left-[10%] top-[-15%] h-[26rem] w-[26rem] rounded-full bg-route-300/25 blur-[90px] sm:h-[34rem] sm:w-[34rem]"
      />
      <div
        className="animate-aurora-b absolute -right-[12%] bottom-[-18%] h-[22rem] w-[22rem] rounded-full bg-accent-300/20 blur-[90px] sm:h-[30rem] sm:w-[30rem]"
      />

      {/* Contour-map texture — reads as a route planner's paper backing */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 900"
        fill="none"
      >
        <path d="M-40 120 C 160 40, 280 220, 480 140 S 780 100, 860 200" stroke="#3A2F9E" strokeWidth="1.5" strokeDasharray="1 9" strokeLinecap="round" />
        <path d="M-40 260 C 140 190, 320 360, 500 270 S 760 250, 860 340" stroke="#3A2F9E" strokeWidth="1.5" strokeDasharray="1 9" strokeLinecap="round" />
        <path d="M-40 420 C 180 340, 300 520, 520 430 S 740 410, 860 500" stroke="#3A2F9E" strokeWidth="1.5" strokeDasharray="1 9" strokeLinecap="round" />
        <path d="M-40 600 C 160 520, 340 700, 540 610 S 780 590, 860 680" stroke="#3A2F9E" strokeWidth="1.5" strokeDasharray="1 9" strokeLinecap="round" />
        <path d="M-40 760 C 180 690, 320 860, 520 770 S 760 750, 860 840" stroke="#3A2F9E" strokeWidth="1.5" strokeDasharray="1 9" strokeLinecap="round" />
      </svg>

      {/* Faint dot texture, matches the brand panel's */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(30,41,59,0.55) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Oversized "W" monogram watermark — modern SaaS-style background
          brand mark (contained in a fixed box, so it never clips like a
          full wordmark would). Soft route→gold gradient, echoing Logo's
          gradient tone at ~4% opacity. */}
      <div
        className="absolute -right-6 -top-10 hidden h-64 w-64 select-none items-center justify-center sm:flex lg:hidden xl:flex"
        aria-hidden="true"
      >
        <span
          className="bg-gradient-to-br from-route-700 via-route-500 to-accent-500 bg-clip-text font-display text-[15rem] font-bold leading-none text-transparent opacity-[0.06]"
        >
          W
        </span>
      </div>
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 opacity-[0.05] sm:h-80 sm:w-80"
      />

      {/* Cursor-following spotlight */}
      <div
        className="absolute inset-0 transition-[background] duration-300 ease-out"
        style={{
          background: `radial-gradient(560px circle at ${spotX}% ${spotY}%, rgba(46,99,138,0.09), transparent 65%)`,
        }}
      />

      {/* Compass rose watermark — one signature mark, not scattered icons */}
      <svg
        className="absolute -right-16 bottom-[-8%] hidden h-72 w-72 text-route-400/[0.12] sm:block lg:h-80 lg:w-80"
        style={layer(offset, 10)}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1" />
        <circle cx="50" cy="50" r="33" stroke="currentColor" strokeWidth="1" />
        <path d="M50 4 L54 46 L50 50 L46 46 Z" fill="currentColor" />
        <path d="M50 96 L46 54 L50 50 L54 54 Z" fill="currentColor" />
        <path d="M4 50 L46 46 L50 50 L46 54 Z" fill="currentColor" />
        <path d="M96 50 L54 54 L50 50 L54 46 Z" fill="currentColor" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}
