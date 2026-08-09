import { useEffect, useRef, useState } from 'react';

// Tracks pointer position within a container, normalized to -1..1 on
// each axis (0,0 = center). Powers the 3D auth scene: the brand panel's
// floating cards move at different depths off this, and the glass form
// card tilts off it too, so the whole screen reacts to one shared cursor
// position instead of feeling like disconnected effects.
//
// No-ops (offset stays 0,0 — everything renders flat) when the user
// prefers reduced motion or there's no fine hover pointer (touch), so
// mobile and accessibility-conscious users get the static version.
export function usePointerParallax() {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReduced || !canHover) return undefined;

    let frame = null;

    function handleMove(e) {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setOffset({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      });
    }

    function handleLeave() {
      if (frame) cancelAnimationFrame(frame);
      setOffset({ x: 0, y: 0 });
    }

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, offset };
}
