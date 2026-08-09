import { useEffect, useRef, useState } from 'react';

/**
 * Keeps a loading flag `true` for at least `minMs` after it first flips
 * on, even if the real condition (`isActive`) resolves sooner. Without
 * this, the branded RouteLoader/FullScreenLoader can resolve in a few ms
 * (e.g. no session cookie -> instant "guest") and the logo never actually
 * gets seen — it just flashes. A short minimum hold makes the loading
 * state feel intentional instead of glitchy, without adding real delay
 * to genuinely slow requests (it only ever adds time on the fast path).
 */
export function useMinDuration(isActive, minMs = 600) {
  const [active, setActive] = useState(isActive);
  const startRef = useRef(isActive ? Date.now() : null);

  useEffect(() => {
    if (isActive) {
      if (startRef.current == null) startRef.current = Date.now();
      setActive(true);
      return undefined;
    }

    if (startRef.current == null) {
      setActive(false);
      return undefined;
    }

    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, minMs - elapsed);
    const timer = setTimeout(() => {
      startRef.current = null;
      setActive(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [isActive, minMs]);

  return active;
}
