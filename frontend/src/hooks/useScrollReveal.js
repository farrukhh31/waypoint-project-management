import { useEffect, useRef, useState } from 'react';

// Attaches to any element and flips `revealed` to true the moment it enters
// the viewport, then disconnects — a one-shot "animate in as you scroll"
// used on cards further down a long list, so scrolling through a big page
// (like a full org's worth of user cards) feels alive rather than having
// everything already sitting there fully rendered. Skips the observer
// entirely under prefers-reduced-motion and just reveals immediately.
export function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, revealed];
}