import clsx from 'clsx';
import { useScrollReveal } from '../../hooks/useScrollReveal';

// Fades + lifts children in the moment they scroll into view, with an
// optional stagger delay — used to give a long analytics page like
// Reports a sense of being "plotted" as you scroll rather than dumped
// on screen fully rendered. Wraps useScrollReveal's one-shot observer;
// no-ops to fully visible under prefers-reduced-motion.
export default function Reveal({ children, delay = 0, className, as: Tag = 'div', ...props }) {
  const [ref, revealed] = useScrollReveal();

  return (
    <Tag
      ref={ref}
      className={clsx(
        'transition-all duration-700 ease-out',
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className
      )}
      style={{ transitionDelay: revealed ? `${delay}ms` : '0ms' }}
      {...props}
    >
      {children}
    </Tag>
  );
}
