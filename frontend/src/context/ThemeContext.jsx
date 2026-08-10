import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'waypoint:theme';

export const ThemeContext = createContext(null);

function readInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// App-wide light/dark toggle. Applies a `dark` class to <html>, which is
// all the rest of the app needs to know about — every color that should
// respond to theme is wired through CSS variables in index.css, so this
// provider's only job is choosing which set is active and persisting the
// choice. Falls back to the OS preference the first time a person visits,
// then remembers whatever they pick after that.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
