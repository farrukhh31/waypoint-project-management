import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../hooks/useTheme';

// Sun/moon pill switch — mirrors Switch's track-and-thumb shape so it reads
// as "one more setting toggle" rather than a bespoke control, but carries
// its own icon pair since on/off here means something visual, not boolean.
export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
      className={clsx(
        'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-line bg-paper px-1 transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-route-500',
        className
      )}
    >
      <Sun className="absolute left-1.5 h-3.5 w-3.5 text-accent-400 transition-opacity duration-200" style={{ opacity: isDark ? 0.35 : 1 }} />
      <Moon className="absolute right-1.5 h-3.5 w-3.5 text-route-300 transition-opacity duration-200" style={{ opacity: isDark ? 1 : 0.35 }} />
      <span
        className={clsx(
          'z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br shadow-card transition-transform duration-200 ease-out',
          isDark ? 'translate-x-6 from-route-500 to-route-600' : 'translate-x-0 from-accent-300 to-accent-400'
        )}
      >
        {isDark ? <Moon className="h-3 w-3 text-white" /> : <Sun className="h-3 w-3 text-white" />}
      </span>
    </button>
  );
}
