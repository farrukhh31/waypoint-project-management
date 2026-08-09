import { useRef } from 'react';
import clsx from 'clsx';

// A light CSS-3D tilt: the card rotates a couple of degrees toward the
// cursor and lifts on a Z-translate, with a soft specular highlight that
// tracks the pointer. No dependency — just perspective + rotateX/Y driven
// by pointer position, reset on leave. Respects prefers-reduced-motion by
// simply never attaching the listener (children still render normally).
export default function TiltCard({ children, className, maxTilt = 6, glare = true, style, ...props }) {
  const ref = useRef(null);
  const glareRef = useRef(null);
  const frame = useRef(null);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function handleMove(e) {
    if (prefersReduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;

    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
      if (glare && glareRef.current) {
        glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.5), transparent 55%)`;
      }
    });
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    if (glareRef.current) glareRef.current.style.background = 'transparent';
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={clsx('relative will-change-transform transition-transform duration-150 ease-out', className)}
      style={{ transformStyle: 'preserve-3d', ...style }}
      {...props}
    >
      {glare && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
